const db = require("../db");
const stripe = require("../utils/stripeClient");

const sendEmail = require("../services/emailService");
const orderConfirmation = require("../templates/orderConfirmation");

// ==========================
// Place Order
// ==========================
// items sent by CartContext.placeOrder are
// { product_id, name, price, quantity, flavour } — NOT { id, ... }.
// Reading item.id here (instead of item.product_id) meant every order
// item bound `undefined` to the INSERT and crashed the whole request.

exports.placeOrder = async (req, res) => {

    const {
        customerName,
        customerEmail,
        phone,
        address,
        city,
        postalCode,
        country,
        items,
        total,
        discount,
        paymentMethod,
        paymentStatus,
        stripePaymentIntentId,
        deliveryMethod,
        deliveryCost
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: 'Order must contain at least one item'
        });
    }

    if (!customerName || !customerEmail || !address || !city || !postalCode) {
        return res.status(400).json({
            error: "Customer name, email, address, city and postal code are required."
        });
    }

    const subtotal = total + (discount || 0);

    // req.user is populated by optionalAuthMiddleware when a valid session
    // cookie/token is present; guests simply get null here and the order
    // is still created (email-only), exactly as before.
    const userId = (req.user && (req.user.userId || req.user.id)) || null;

    // Only a real, server-verified card payment can mark an order as Paid.
    // Every other method (COD, bank transfer, gpay, applepay) starts as
    // Pending regardless of what the client claims — the client's
    // paymentStatus field is never trusted for these. COD is paid on
    // delivery and bank transfer needs manual verification, so Pending is
    // correct there anyway. gpay/applepay are a simulated (non-real)
    // integration in this codebase, not a live payment rail, so treating
    // them as automatically "paid" let anyone create a free order via a
    // direct API call — they now require the same manual admin
    // confirmation as bank transfer until they're wired to real,
    // server-verified payment processing.
    let isPaid = false;

    if (paymentMethod === 'card') {

        if (!stripePaymentIntentId) {
            return res.status(400).json({
                error: "A Stripe payment intent id is required for card orders."
            });
        }

        try {

            const intent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
            const expectedAmount = Math.round(total * 100);

            if (intent.status !== 'succeeded') {
                return res.status(402).json({
                    error: `Payment has not succeeded (status: ${intent.status}).`
                });
            }

            if (intent.amount !== expectedAmount) {
                return res.status(400).json({
                    error: "Payment amount does not match order total."
                });
            }

            isPaid = true;

        } catch (stripeErr) {

            return res.status(400).json({
                error: "Could not verify payment with Stripe: " + stripeErr.message
            });

        }

    }

    db.serialize(() => {

        const orderSql = `
        INSERT INTO orders
        (
            user_id,
            customer_name,
            email,
            phone,
            address,
            city,
            postal_code,
            country,
            delivery_method,
            delivery_cost,
            payment_method,
            payment_status,
            stripe_payment_intent,
            subtotal,
            discount,
            total,
            status,
            paid_at
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        db.run(
            orderSql,
            [
                userId,
                customerName,
                customerEmail || "",
                phone || "",
                address || "",
                city || "",
                postalCode || "",
                country || "",
                deliveryMethod || "standard",
                deliveryCost || 0,
                paymentMethod || "card",
                isPaid ? 'paid' : 'pending',
                stripePaymentIntentId || null,
                subtotal,
                discount || 0,
                total,
                isPaid ? 'Paid' : 'Pending',
                isPaid ? new Date().toISOString() : null
            ],
            async function (err) {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                const orderId = this.lastID;

                try {

                    const itemSql = `
                    INSERT INTO order_items
                    (
                        order_id,
                        product_id,
                        product_name,
                        quantity,
                        price,
                        flavour
                    )
                    VALUES (?,?,?,?,?,?)
                    `;

                    const stmt = db.prepare(itemSql);

                    items.forEach(item => {

                        stmt.run(
                            orderId,
                            item.product_id,
                            item.name,
                            item.quantity,
                            item.price,
                            item.flavour || ''
                        );

                    });

                    await new Promise((resolve, reject) => {
                        stmt.finalize(err2 => err2 ? reject(err2) : resolve());
                    });

                } catch (itemErr) {

                    return res.status(500).json({
                        error: "Order was created but items failed to save: " + itemErr.message
                    });

                }

                // ==========================
                // Send Confirmation Email (best-effort — never fails the order)
                // ==========================

                try {

                    if (customerEmail) {

                        await sendEmail({

                            to: customerEmail,

                            subject: `Order Confirmation #${orderId} - CeltiCore`,

                            html: orderConfirmation({

                                customerName,

                                orderId,

                                items: items.map(item => ({
                                    product_name: item.name,
                                    quantity: item.quantity,
                                    price: item.price
                                })),

                                subtotal,

                                discount: discount || 0,

                                total,

                                paymentMethod: paymentMethod || 'card',

                                deliveryMethod: deliveryMethod || 'standard',

                                address: `${address}, ${city}, ${postalCode}, ${country || ''}`,

                                currency: "€"

                            })

                        });

                    }

                } catch (emailError) {

                    console.error("Order confirmation email failed:", emailError.message);

                }

                // Return the full order object — the frontend's success screen
                // (and ordersService.placeOrder mapping) reads fields like
                // id/total/customerName/address off this.
                res.json({

                    success: true,

                    orderId,

                    message: "Order placed successfully",

                    order: {
                        id: orderId,
                        customer_name: customerName,
                        customer_email: customerEmail || "",
                        phone: phone || "",
                        address: address || "",
                        city: city || "",
                        postal_code: postalCode || "",
                        country: country || "",
                        items: items.map(item => ({
                            product_id: item.product_id,
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            flavour: item.flavour || ''
                        })),
                        total,
                        subtotal,
                        discount: discount || 0,
                        payment_method: paymentMethod || "card",
                        payment_status: isPaid ? 'paid' : 'pending',
                        stripe_payment_intent_id: stripePaymentIntentId || '',
                        delivery_method: deliveryMethod || "standard",
                        delivery_cost: deliveryCost || 0,
                        status: isPaid ? 'Paid' : 'Pending',
                        created_at: new Date().toISOString()
                    }

                });

            }
        );

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
// Update Order Status
// ==========================

exports.updateOrderStatus = (req, res) => {

    const { status } = req.body;

    if (!status) {
        return res.status(400).json({
            error: "A 'status' value is required."
        });
    }

    db.run(
        `
        UPDATE orders
        SET status = ?
        WHERE id = ?
        `,
        [status, req.params.id],
        function (err) {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Order not found."
                });
            }

            res.json({
                success: true,
                message: "Order status updated"
            });

        }
    );

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
// Delete Order
// ==========================

exports.deleteOrder = (req, res) => {

    db.run(
        `
        DELETE FROM orders
        WHERE id = ?
        `,
        req.params.id,
        function (err) {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            db.run(
                `
                DELETE FROM order_items
                WHERE order_id = ?
                `,
                req.params.id
            );

            res.json({
                message: "Order deleted"
            });

        }
    );

};