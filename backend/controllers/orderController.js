const db = require("../db");
const stripe = require("../utils/stripeClient");

const sendEmail = require("../services/emailService");
const orderConfirmation = require("../templates/orderConfirmation");

const {
    validateIrishAddress,
    resolveCheckoutDelivery,
    loadDeliveryNotice,
    toCents,
    formatEstimate,
    formatOrderAddress
} = require("../utils/delivery");
const { COURIER_OPTIONS, isValidCourier, DEFAULT_COURIER } = require("../services/courierService");

// ==========================
// Place Order
// ==========================
// items sent by CartContext.placeOrder are
// { product_id, name, price, quantity, flavour } — NOT { id, ... }.
// Reading item.id here (instead of item.product_id) meant every order
// item bound `undefined` to the INSERT and crashed the whole request.
//
// PRICING INTEGRITY
// ------------------
// Previously this endpoint trusted the client-submitted item prices,
// subtotal, and discount for every field it stored (order_items.price,
// orders.subtotal, orders.discount) and only cross-checked the *total*
// against Stripe for card payments — and did no cross-check at all for
// every other payment method (bank transfer, COD, gpay/applepay). That
// meant:
//   - A card payer could pay the correct total while submitting a
//     fabricated line-item/discount breakdown, corrupting order_items,
//     the confirmation email, and admin sales/revenue reports.
//   - A non-card order's total/discount/prices were never verified
//     against the database at all before being stored as the order's
//     official record.
//
// Fixed by recomputing every price-affecting field here, from the
// `products` table and (if a coupon code was supplied) the `coupons`
// table, the same way paymentController.createPaymentIntent already
// does for the Stripe charge itself. The client-submitted items/total/
// discount are now only used to build the request; the *server's own*
// recalculated values are what get stored and (for card orders)
// compared against the Stripe-confirmed amount.
async function recomputeOrderPricing(items, couponCode) {

    if (!Array.isArray(items) || items.length === 0) {
        throw { status: 400, message: "Order must contain at least one item" };
    }

    for (const item of items) {
        const qty = Number(item.quantity);
        if (!item.product_id || !Number.isFinite(qty) || qty <= 0) {
            throw { status: 400, message: `Invalid item in cart (product id: ${item.product_id})` };
        }
    }

    const productIds = [...new Set(items.map(i => i.product_id))];
    const placeholders = productIds.map(() => "?").join(",");

    const products = await new Promise((resolve, reject) => {
        db.all(
            `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
            productIds,
            (err, rows) => err ? reject(err) : resolve(rows)
        );
    });

    const productById = {};
    products.forEach(p => { productById[p.id] = p; });

    const recomputedItems = items.map(item => {
        const product = productById[item.product_id];
        if (!product) {
            throw { status: 400, message: `Product ${item.product_id} no longer exists` };
        }
        return {
            product_id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: Number(item.quantity),
            flavour: typeof item.flavour === "string" ? item.flavour : ""
        };
    });

    const subtotal = recomputedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    let discount = 0;

    if (couponCode) {

        const coupon = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM coupons WHERE code = ? AND is_active = 1`,
                [couponCode],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });

        const isValid = coupon && (!coupon.expiry_date || new Date(coupon.expiry_date) >= new Date());

        if (isValid) {
            if (coupon.discount_type === "percentage") {
                discount = (subtotal * Number(coupon.discount_value)) / 100;
            } else if (coupon.discount_type === "fixed") {
                discount = Number(coupon.discount_value);
            }
        }
    }

    const total = Math.max(0, subtotal - discount);

    return { items: recomputedItems, subtotal, discount, total };
}

// Shared with paymentController + deliveryController so the PaymentIntent,
// the delivery quote and the saved order are always priced identically.
exports.recomputeOrderPricing = recomputeOrderPricing;

// Small promise wrappers over the sqlite-style db helper.
const dbRun = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });

const dbGet = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });

const dbAll = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });

// The order object returned to the browser after checkout (and again if the
// same payment is submitted twice). Always built from the saved row so what
// the customer sees is exactly what was stored.
async function loadOrderResponse(orderId) {

    const o = await dbGet(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!o) return null;

    const itemRows = await dbAll(
        `SELECT product_id, product_name AS name, quantity, price, flavour FROM order_items WHERE order_id = ?`,
        [orderId]
    );

    return {
        id: o.id,
        customer_name: o.customer_name,
        customer_email: o.email || "",
        phone: o.phone || "",
        address: o.address || "",
        address2: o.address2 || "",
        city: o.city || "",
        county: o.county || "",
        postal_code: o.postal_code || "",
        country: o.country || "",
        items: itemRows.map(item => ({
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            flavour: item.flavour || ""
        })),
        total: o.total,
        subtotal: o.subtotal,
        discount: o.discount || 0,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        stripe_payment_intent_id: o.stripe_payment_intent || "",
        delivery_method: o.delivery_method,
        delivery_method_name: o.delivery_method_name || "",
        delivery_cost: o.delivery_cost || 0,
        delivery_free: Number(o.delivery_free) === 1,
        delivery_est_min_days: o.delivery_est_min_days,
        delivery_est_max_days: o.delivery_est_max_days,
        delivery_estimate_text: o.delivery_estimate_text || "",
        status: o.status,
        created_at: o.created_at
    };
}

exports.placeOrder = async (req, res) => {

    const {
        customerName,
        customerEmail,
        phone,
        address,
        address2,
        city,
        county,
        postalCode,
        country,
        items: rawItems,
        couponCode,
        paymentMethod,
        stripePaymentIntentId
        // NOTE: `deliveryMethod` / `deliveryCost` from the browser is deliberately NOT read any
        // more. The delivery fee is always recalculated below from the
        // admin-configured delivery settings.
    } = req.body;

    // ==========================
    // 1) Address — validated again here even though the checkout form
    //    validates it too (never trust the browser). Republic of Ireland only.
    // ==========================
    const addressCheck = validateIrishAddress({
        customerName, customerEmail, phone, address, address2,
        city, county, postalCode, country
    });

    if (!addressCheck.ok) {
        return res.status(400).json({
            error: Object.values(addressCheck.errors)[0],
            errors: addressCheck.errors
        });
    }

    const addr = addressCheck.value;

    // ==========================
    // 2) Same payment submitted twice (double click, retry, flaky network):
    //    hand back the order that already exists instead of creating a
    //    second one for the same charge.
    // ==========================
    if (paymentMethod === 'card' && stripePaymentIntentId) {
        try {
            const dupe = await dbGet(
                `SELECT id, email FROM orders WHERE stripe_payment_intent = ?`,
                [stripePaymentIntentId]
            );

            if (dupe) {
                if (String(dupe.email || "").toLowerCase() !== addr.customerEmail.toLowerCase()) {
                    return res.status(409).json({
                        error: "This payment has already been used for another order."
                    });
                }
                const existingOrder = await loadOrderResponse(dupe.id);
                return res.json({
                    success: true,
                    orderId: dupe.id,
                    message: "Order already placed",
                    duplicate: true,
                    order: existingOrder
                });
            }
        } catch (dupeErr) {
            return res.status(500).json({ error: dupeErr.message });
        }
    }

    // ==========================
    // 3) Recompute items/subtotal/discount from the database, then price the
    //    chosen delivery method. This is the single source of truth from
    //    here on — the client's own totals/prices/delivery fee are ignored.
    //
    //    Final Total = Product Subtotal - Discount + Delivery Fee
    // ==========================
    let subtotal, discount, items, delivery, total, chargeCents;

    try {

        ({ items, subtotal, discount } =
            await recomputeOrderPricing(rawItems, couponCode));

        const goodsTotal = Math.max(0, subtotal - discount);

        delivery = await resolveCheckoutDelivery(goodsTotal);

        chargeCents = toCents(goodsTotal) + toCents(delivery.fee);
        total = chargeCents / 100;

    } catch (pricingErr) {
        return res.status(pricingErr.status || 500).json({
            error: pricingErr.message || "Could not calculate order pricing."
        });
    }

    // req.user is populated by optionalAuthMiddleware when a valid session
    // cookie/token is present; guests simply get null here and the order
    // is still created (email-only), exactly as before.
    const userId = (req.user && (req.user.userId || req.user.id)) || null;

    // Only a real, server-verified card payment can mark an order as Paid.
    // Every other method (COD, bank transfer, gpay, applepay) starts as
    // Pending regardless of what the client claims.
    let isPaid = false;

    if (paymentMethod === 'card') {

        if (!stripePaymentIntentId) {
            return res.status(400).json({
                error: "A Stripe payment intent id is required for card orders."
            });
        }

        try {

            const intent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

            if (intent.status !== 'succeeded') {
                return res.status(402).json({
                    error: `Payment has not succeeded (status: ${intent.status}).`
                });
            }

            // The amount Stripe actually charged must equal the amount the
            // server just recalculated (products - coupon + delivery).
            if (intent.amount !== chargeCents) {
                return res.status(400).json({
                    error: "Payment amount does not match the current order total. Prices, your coupon or the delivery charge may have changed — please contact support with your payment reference " + stripePaymentIntentId + "."
                });
            }

            const expectedCurrency = (process.env.STORE_CURRENCY || "eur").toLowerCase();
            if (String(intent.currency).toLowerCase() !== expectedCurrency) {
                return res.status(400).json({
                    error: "Payment currency does not match the store currency."
                });
            }

            isPaid = true;

        } catch (stripeErr) {

            return res.status(400).json({
                error: "Could not verify payment with Stripe: " + stripeErr.message
            });

        }

    }

    // ==========================
    // 4) Save the order
    // ==========================
    let orderId;

    try {

        const inserted = await dbRun(
            `
            INSERT INTO orders
            (
                user_id,
                customer_name,
                email,
                phone,
                address,
                address2,
                city,
                county,
                postal_code,
                country,
                delivery_method,
                delivery_method_name,
                delivery_cost,
                delivery_free,
                delivery_est_min_days,
                delivery_est_max_days,
                delivery_estimate_text,
                payment_method,
                payment_status,
                stripe_payment_intent,
                subtotal,
                discount,
                total,
                status,
                paid_at
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `,
            [
                userId,
                addr.customerName,
                addr.customerEmail,
                addr.phone,
                addr.address,
                addr.address2,
                addr.city,
                addr.county,
                addr.postalCode,
                addr.country,
                delivery.code,
                delivery.name,
                delivery.fee,
                delivery.freeApplied ? 1 : 0,
                delivery.estMinDays,
                delivery.estMaxDays,
                delivery.estimateText || null,
                paymentMethod || "card",
                isPaid ? 'paid' : 'pending',
                stripePaymentIntentId || null,
                subtotal,
                discount || 0,
                total,
                isPaid ? 'Paid' : 'Pending',
                isPaid ? new Date().toISOString() : null
            ]
        );

        orderId = inserted.lastID;

    } catch (err) {

        // Two requests for the same PaymentIntent arrived at the same moment:
        // the unique index rejected the second one. Return the first order.
        if (err && err.errno === 1062 && stripePaymentIntentId) {
            try {
                const dupe = await dbGet(
                    `SELECT id FROM orders WHERE stripe_payment_intent = ?`,
                    [stripePaymentIntentId]
                );
                if (dupe) {
                    return res.json({
                        success: true,
                        orderId: dupe.id,
                        message: "Order already placed",
                        duplicate: true,
                        order: await loadOrderResponse(dupe.id)
                    });
                }
            } catch (lookupErr) {
                return res.status(500).json({ error: lookupErr.message });
            }
        }

        return res.status(500).json({
            error: err.message
        });

    }

    try {

        await Promise.all(items.map(item =>
            dbRun(
                `
                INSERT INTO order_items
                (order_id, product_id, product_name, quantity, price, flavour)
                VALUES (?,?,?,?,?,?)
                `,
                [
                    orderId,
                    item.product_id,
                    item.name,
                    item.quantity,
                    item.price,
                    item.flavour || ''
                ]
            )
        ));

    } catch (itemErr) {

        return res.status(500).json({
            error: "Order was created but items failed to save: " + itemErr.message
        });

    }

    // ==========================
    // 5) Confirmation email (best-effort — never fails the order)
    // ==========================
    try {

        await sendEmail({

            to: addr.customerEmail,

            subject: `Order Confirmation #${orderId} - CeltiCore`,

            html: orderConfirmation({

                customerName: addr.customerName,

                orderId,

                items: items.map(item => ({
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),

                subtotal,

                discount: discount || 0,

                deliveryFee: delivery.fee,

                deliveryFree: delivery.freeApplied,

                total,

                paymentMethod: paymentMethod || 'card',

                deliveryMethod: delivery.name,

                estimatedDelivery: delivery.estimateText || formatEstimate(delivery.estMinDays, delivery.estMaxDays),

                deliveryNotice: await loadDeliveryNotice(),

                address: formatOrderAddress({
                    address: addr.address,
                    address2: addr.address2,
                    city: addr.city,
                    county: addr.county,
                    postal_code: addr.postalCode,
                    country: addr.country
                }),

                currency: "€"

            })

        });

    } catch (emailError) {

        console.error("Order confirmation email failed:", emailError.message);

    }

    // Return the full order object — the frontend's success screen reads
    // fields like id/total/customerName/address off this.
    res.json({
        success: true,
        orderId,
        message: "Order placed successfully",
        order: await loadOrderResponse(orderId)
    });

};

// ==========================
// Get Orders
// ==========================

exports.getOrders = (req, res) => {

    db.all(
        `
        SELECT
            id,
            customer_name,
            email AS customer_email,
            phone,
            address,
            city,
            postal_code,
            country,
            delivery_method,
            delivery_cost,
            meetup_point,
            timeslot,
            payment_method,
            payment_status,
            subtotal,
            discount,
            total,
            tracking_number,
            tracking_url,
            courier_name,
            address2,
            county,
            delivery_method_name,
            delivery_free,
            delivery_est_min_days,
            delivery_est_max_days,
            delivery_estimate_text,
            processing_at,
            dispatched_at,
            delivered_at,
            label_uploaded_at,
            notes,
            is_sameday,
            sameday_area,
            status,
            stripe_session_id,
            stripe_payment_intent AS stripe_payment_intent_id,
            paid_at,
            created_at
        FROM orders
        ORDER BY created_at DESC
        `,
        [],
        (err, orders) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (orders.length === 0) {
                return res.json(orders);
            }

            const orderIds = orders.map(o => o.id);
            const placeholders = orderIds.map(() => '?').join(',');

            db.all(
                `
                SELECT
                    order_id,
                    product_id,
                    product_name AS name,
                    quantity,
                    price,
                    flavour
                FROM order_items
                WHERE order_id IN (${placeholders})
                `,
                orderIds,
                (itemsErr, itemRows) => {

                    if (itemsErr) {
                        return res.status(500).json({
                            error: itemsErr.message
                        });
                    }

                    const itemsByOrder = {};
                    itemRows.forEach(row => {
                        if (!itemsByOrder[row.order_id]) {
                            itemsByOrder[row.order_id] = [];
                        }
                        itemsByOrder[row.order_id].push({
                            product_id: row.product_id,
                            name: row.name,
                            quantity: row.quantity,
                            price: row.price,
                            flavour: row.flavour || ''
                        });
                    });

                    const withItems = orders.map(order => ({
                        ...order,
                        items: itemsByOrder[order.id] || []
                    }));

                    res.json(withItems);
                }
            );

        }
    );

};

// ==========================
// Update Order Status / Delivery Details (admin only)
// ==========================
// One endpoint for everything the admin does to an order's delivery:
//   { status }                         -> Processing / Dispatched ("shipped") / Delivered ...
//   { courierName, trackingNumber, trackingUrl }  -> manual courier details
// Any combination can be sent together. Courier/tracking are plain manual
// entries — nothing here calls a courier API.
//
// Emails: sent only when something REALLY changed (status, or tracking
// details), so saving the same values again never re-sends an email:
//   -> processing  : "Order is being prepared"
//   -> shipped     : "Order dispatched" (+ courier & tracking if entered)
//   -> delivered   : "Order delivered"
//   -> cancelled   : "Order cancelled"
//   tracking added/changed without a status change: "Tracking updated"

const ALLOWED_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const TRACKING_NUMBER_REGEX = /^[A-Za-z0-9][A-Za-z0-9 \-_./]{0,99}$/;

function isHttpUrl(value) {
    try {
        const u = new URL(value);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

exports.updateOrderStatus = async (req, res) => {

    const body = req.body || {};

    const hasStatus = typeof body.status === 'string' && body.status.trim() !== '';
    const hasCourier = body.courierName !== undefined;
    const hasTracking = body.trackingNumber !== undefined;
    const hasUrl = body.trackingUrl !== undefined;

    if (!hasStatus && !hasCourier && !hasTracking && !hasUrl) {
        return res.status(400).json({
            error: "A 'status' value is required."
        });
    }

    // ---- validate input -------------------------------------------------
    let requestedStatus = null;
    if (hasStatus) {
        requestedStatus = body.status.trim().toLowerCase();
        if (!ALLOWED_STATUSES.includes(requestedStatus)) {
            return res.status(400).json({
                error: `Invalid status. Use one of: ${ALLOWED_STATUSES.join(', ')}.`
            });
        }
    }

    let courierName = null;
    if (hasCourier) {
        courierName = String(body.courierName || '').trim();
        if (courierName && !isValidCourier(courierName)) {
            return res.status(400).json({
                error: `Invalid courier. Use one of: ${COURIER_OPTIONS.map(c => c.value).join(', ')}.`
            });
        }
    }

    let trackingNumber = null;
    if (hasTracking) {
        trackingNumber = String(body.trackingNumber || '').trim();
        if (trackingNumber && !TRACKING_NUMBER_REGEX.test(trackingNumber)) {
            return res.status(400).json({
                error: "Tracking number can only contain letters, numbers, spaces and - _ . / (max 100 characters)."
            });
        }
    }

    let trackingUrl = null;
    if (hasUrl) {
        trackingUrl = String(body.trackingUrl || '').trim();
        if (trackingUrl && (trackingUrl.length > 500 || !isHttpUrl(trackingUrl))) {
            return res.status(400).json({
                error: "Tracking URL must be a valid http(s) link (max 500 characters)."
            });
        }
    }

    try {

        const existingOrder = await dbGet(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);

        if (!existingOrder) {
            return res.status(404).json({ error: "Order not found." });
        }

        const previousStatus = (existingOrder.status || '').toLowerCase();
        const newStatus = requestedStatus || previousStatus;

        // Everything ships with DPD: when an order is dispatched and no courier
        // was chosen yet, record DPD.
        let mergedCourier = hasCourier ? courierName : (existingOrder.courier_name || '');
        if (requestedStatus === 'shipped' && !mergedCourier) mergedCourier = DEFAULT_COURIER;
        const mergedNumber = hasTracking ? trackingNumber : (existingOrder.tracking_number || '');
        const mergedUrl = hasUrl ? trackingUrl : (existingOrder.tracking_url || '');

        // Keep existing capitalisation untouched when status isn't being changed.
        const statusToStore = requestedStatus || existingOrder.status;

        // Dispatch / delivery dates are set by the server — never by the browser.
        const stamps = [];
        if (requestedStatus && requestedStatus !== previousStatus) {
            if (requestedStatus === 'processing') {
                stamps.push('processing_at = COALESCE(processing_at, CURRENT_TIMESTAMP)', 'dispatched_at = NULL', 'delivered_at = NULL');
            } else if (requestedStatus === 'shipped') {
                stamps.push('dispatched_at = COALESCE(dispatched_at, CURRENT_TIMESTAMP)', 'delivered_at = NULL');
            } else if (requestedStatus === 'delivered') {
                stamps.push('delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)');
            } else if (requestedStatus === 'pending' || requestedStatus === 'paid') {
                stamps.push('processing_at = NULL', 'dispatched_at = NULL', 'delivered_at = NULL');
            }
        }

        const result = await dbRun(
            `
            UPDATE orders
            SET status = ?,
                courier_name = ?,
                tracking_number = ?,
                tracking_url = ?
                ${stamps.length ? ',' + stamps.join(', ') : ''}
            WHERE id = ?
            `,
            [
                statusToStore,
                mergedCourier || null,
                mergedNumber || null,
                mergedUrl || null,
                req.params.id
            ]
        );

        if (result.changes === 0 && previousStatus === newStatus && !hasCourier && !hasTracking && !hasUrl) {
            return res.status(404).json({ error: "Order not found." });
        }

        const fresh = await dbGet(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);

        res.json({
            success: true,
            message: "Order updated",
            order: {
                status: fresh.status,
                courier_name: fresh.courier_name || '',
                tracking_number: fresh.tracking_number || '',
                tracking_url: fresh.tracking_url || '',
                processing_at: fresh.processing_at || null,
                dispatched_at: fresh.dispatched_at || null,
                delivered_at: fresh.delivered_at || null
            }
        });

        // ==========================
        // Best-effort emails (never block the response above)
        // ==========================
        const statusChanged = previousStatus !== newStatus;
        const trackingChanged =
            mergedNumber !== '' &&
            (
                mergedNumber !== (existingOrder.tracking_number || '') ||
                mergedCourier !== (existingOrder.courier_name || '') ||
                mergedUrl !== (existingOrder.tracking_url || '')
            );

        let emailKind = null;

        if (statusChanged && ['processing', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
            emailKind = newStatus;
        } else if (!statusChanged && trackingChanged && newStatus !== 'cancelled') {
            emailKind = 'tracking';
        }

        if (!emailKind) return;

        try {

            const items = await dbAll(
                `
                SELECT product_id, product_name AS name, quantity, price, flavour
                FROM order_items
                WHERE order_id = ?
                `,
                [req.params.id]
            );

            const emailOrder = {
                customerEmail: fresh.email,
                customerName: fresh.customer_name,
                orderId: fresh.id,
                items: items || [],
                total: fresh.total,
                subtotal: fresh.subtotal,
                discount: fresh.discount,
                paymentStatus: fresh.payment_status,
                status: newStatus,
                deliveryFee: fresh.delivery_cost,
                deliveryFree: Number(fresh.delivery_free) === 1,
                deliveryMethodName: fresh.delivery_method_name || '',
                // Estimate wording comes from the delivery method the customer
                // was charged for. It is an estimate only, never a promise.
                estimatedDelivery: '',
                estimatedDays: fresh.delivery_estimate_text || formatEstimate(fresh.delivery_est_min_days, fresh.delivery_est_max_days),
                deliveryNotice: await loadDeliveryNotice(),
                address: formatOrderAddress(fresh),
                courierName: fresh.courier_name || '',
                trackingNumber: fresh.tracking_number || '',
                trackingUrl: fresh.tracking_url || ''
            };

            if (emailKind === 'processing') {
                await sendEmail.sendOrderProcessing(emailOrder);
            } else if (emailKind === 'shipped') {
                await sendEmail.sendOrderShipped(emailOrder);
            } else if (emailKind === 'delivered') {
                await sendEmail.sendOrderDelivered(emailOrder);
            } else if (emailKind === 'cancelled') {
                await sendEmail.sendOrderCancelled(emailOrder);
            } else if (emailKind === 'tracking') {
                await sendEmail.sendTrackingUpdated(emailOrder);
            }

        } catch (emailErr) {
            console.error(`Order ${emailKind} email failed:`, emailErr.message);
        }

    } catch (err) {

        if (!res.headersSent) {
            return res.status(500).json({
                error: err.message
            });
        }
        console.error("Order update follow-up failed:", err.message);

    }

};

// ==========================
// Get My Orders (logged-in customer)
// ==========================
// Powers the "My Orders" page: every order placed while logged in as this
// user (guest/email-only orders placed before an account existed, or under
// a different account, are intentionally not included here — there's no
// reliable link to them without a shared user_id).

exports.getMyOrders = (req, res) => {

    const userId = req.user.userId || req.user.id;

    db.all(
        `
        SELECT
            id,
            customer_name,
            email AS customer_email,
            phone,
            address,
            city,
            postal_code,
            country,
            delivery_method,
            delivery_cost,
            payment_method,
            payment_status,
            subtotal,
            discount,
            total,
            tracking_number,
            tracking_url,
            courier_name,
            address2,
            county,
            delivery_method_name,
            delivery_free,
            delivery_est_min_days,
            delivery_est_max_days,
            delivery_estimate_text,
            processing_at,
            dispatched_at,
            delivered_at,
            paid_at,
            status,
            created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [userId],
        (err, orders) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (orders.length === 0) {
                return res.json([]);
            }

            const orderIds = orders.map(o => o.id);
            const placeholders = orderIds.map(() => '?').join(',');

            db.all(
                `
                SELECT
                    order_id,
                    product_id,
                    product_name AS name,
                    quantity,
                    price,
                    flavour
                FROM order_items
                WHERE order_id IN (${placeholders})
                `,
                orderIds,
                (itemsErr, itemRows) => {

                    if (itemsErr) {
                        return res.status(500).json({ error: itemsErr.message });
                    }

                    // Pull this user's own reviews for these orders (any
                    // status) so the UI can show "Edit Review" instead of
                    // "Write a Review" once one exists, and reflect its
                    // current moderation status.
                    db.all(
                        `
                        SELECT
                            id, order_id, product_id, rating, title, review,
                            images, status, helpful_count, created_at, updated_at
                        FROM reviews
                        WHERE order_id IN (${placeholders}) AND user_id = ?
                        `,
                        [...orderIds, userId],
                        (revErr, reviewRows) => {

                            if (revErr) {
                                return res.status(500).json({ error: revErr.message });
                            }

                            const itemsByOrder = {};
                            itemRows.forEach(row => {
                                if (!itemsByOrder[row.order_id]) {
                                    itemsByOrder[row.order_id] = [];
                                }
                                itemsByOrder[row.order_id].push({
                                    product_id: row.product_id,
                                    name: row.name,
                                    quantity: row.quantity,
                                    price: row.price,
                                    flavour: row.flavour || ''
                                });
                            });

                            const reviewByOrderProduct = {};
                            reviewRows.forEach(r => {
                                reviewByOrderProduct[`${r.order_id}_${r.product_id}`] = {
                                    ...r,
                                    images: (() => {
                                        try { return JSON.parse(r.images || '[]'); }
                                        catch { return []; }
                                    })()
                                };
                            });

                            const isDelivered = (status) =>
                                typeof status === 'string' && status.toLowerCase() === 'delivered';

                            const withItems = orders.map(order => ({
                                ...order,
                                canReview: isDelivered(order.status),
                                items: (itemsByOrder[order.id] || []).map(item => ({
                                    ...item,
                                    review: reviewByOrderProduct[`${order.id}_${item.product_id}`] || null
                                }))
                            }));

                            res.json(withItems);
                        }
                    );
                }
            );
        }
    );

};

// ==========================
// Track Order (public, guest — no auth)
// ==========================
// Checkout never offers account creation, and "My Orders" above requires a
// login it never gave the shopper a way to get — so a guest who just paid
// had no way to ever look their order up again. This is that path: the
// Order ID plus the email it was placed under is enough to prove you
// placed it, without needing an account.
//
// Requiring BOTH (not just the id) matters: order ids are sequential, so
// id alone would let anyone page through ?orderId=1,2,3... and read out
// other customers' names/addresses. The email match is the actual "prove
// you placed this order" check. On a miss, the response is identical
// whether the id doesn't exist or just doesn't match that email — telling
// them apart would confirm an order with that id exists at all.
exports.trackOrder = (req, res) => {

    const { orderId, email } = req.body;

    if (!orderId || !email) {
        return res.status(400).json({
            error: "Both an Order ID and the email used at checkout are required."
        });
    }

    db.get(
        `
        SELECT
            id,
            customer_name,
            email,
            address,
            address2,
            city,
            county,
            postal_code,
            country,
            payment_status,
            subtotal,
            discount,
            total,
            delivery_method,
            delivery_method_name,
            delivery_cost,
            delivery_free,
            delivery_est_min_days,
            delivery_est_max_days,
            delivery_estimate_text,
            courier_name,
            tracking_number,
            tracking_url,
            paid_at,
            processing_at,
            dispatched_at,
            delivered_at,
            status,
            created_at
        FROM orders
        WHERE id = ? AND LOWER(email) = LOWER(?)
        `,
        [orderId, email],
        (err, order) => {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!order) {
                return res.status(404).json({
                    error: "We couldn't find an order matching that Order ID and email."
                });
            }

            db.all(
                `
                SELECT product_name AS name, quantity, price, flavour
                FROM order_items
                WHERE order_id = ?
                `,
                [order.id],
                (itemsErr, items) => {

                    if (itemsErr) {
                        return res.status(500).json({ error: itemsErr.message });
                    }

                    res.json({
                        success: true,
                        order: {
                            id: order.id,
                            status: order.status,
                            paymentStatus: order.payment_status,
                            total: order.total,
                            createdAt: order.created_at,
                            customerName: order.customer_name,
                            address: order.address,
                            address2: order.address2 || '',
                            city: order.city,
                            county: order.county || '',
                            postalCode: order.postal_code,
                            country: order.country,
                            subtotal: order.subtotal,
                            discount: order.discount || 0,
                            deliveryMethod: order.delivery_method,
                            deliveryMethodName: order.delivery_method_name || '',
                            deliveryCost: order.delivery_cost || 0,
                            deliveryFree: Number(order.delivery_free) === 1,
                            deliveryEstMinDays: order.delivery_est_min_days,
                            deliveryEstMaxDays: order.delivery_est_max_days,
                            deliveryEstimateText: order.delivery_estimate_text || '',
                            courierName: order.courier_name || '',
                            trackingNumber: order.tracking_number || '',
                            trackingUrl: order.tracking_url || '',
                            paidAt: order.paid_at || null,
                            processingAt: order.processing_at || null,
                            dispatchedAt: order.dispatched_at || null,
                            deliveredAt: order.delivered_at || null,
                            items: items || []
                        }
                    });

                }
            );

        }
    );

};

// ==========================
// Delete Order
// ==========================

exports.deleteOrder = (req, res) => {

    const orderId = req.params.id;

    // Best effort: remove the uploaded DPD label file (it contains the
    // customer's address) when the order is deleted.
    db.get(`SELECT label_file FROM orders WHERE id = ?`, [orderId], (labelErr, labelRow) => {
        if (!labelErr && labelRow && labelRow.label_file) {
            require("./deliveryController").removeLabelFile(labelRow.label_file);
        }
    });

    // Child rows must go before the parent — `order_items` (and any
    // `reviews` left on this order) hold a foreign key on orders.id, so the
    // database rejects deleting the order row while they still point at it.
    // This previously deleted `orders` first and `order_items` second
    // (backwards), and never checked whether the order_items delete even
    // succeeded — which is exactly what produced the
    // "Cannot delete or update a parent row: a foreign key constraint
    // fails" error. Reviews are deleted here too since a review can't
    // meaningfully exist once its order is gone.
    db.run(
        `
        DELETE FROM reviews
        WHERE order_id = ?
        `,
        orderId,
        function (reviewsErr) {

            if (reviewsErr) {

                return res.status(500).json({
                    error: reviewsErr.message
                });

            }

            db.run(
                `
                DELETE FROM order_items
                WHERE order_id = ?
                `,
                orderId,
                function (itemsErr) {

                    if (itemsErr) {

                        return res.status(500).json({
                            error: itemsErr.message
                        });

                    }

                    db.run(
                        `
                        DELETE FROM orders
                        WHERE id = ?
                        `,
                        orderId,
                        function (orderErr) {

                            if (orderErr) {

                                return res.status(500).json({
                                    error: orderErr.message
                                });

                            }

                            if (this.changes === 0) {
                                return res.status(404).json({
                                    error: "Order not found"
                                });
                            }

                            res.json({
                                success: true,
                                message: "Order deleted"
                            });

                        }
                    );

                }
            );

        }
    );

};