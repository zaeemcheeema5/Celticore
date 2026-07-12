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

    // For real card payments, don't trust the client's claimed paymentStatus —
    // confirm the PaymentIntent actually succeeded, and that its amount matches
    // this order's total, directly against Stripe. (gpay/applepay stay
    // client-reported since those are simulated flows in this codebase, not
    // real payment rails.)
    let isPaid = paymentStatus === 'paid';

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
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        db.run(
            orderSql,
            [
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
                isPaid ? 'paid' : (paymentStatus || 'pending'),
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

                                currency: "£"

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
                        payment_status: isPaid ? 'paid' : (paymentStatus || 'pending'),
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
