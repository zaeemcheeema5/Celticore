const db = require("../db");

const sendEmail = require("../services/emailService");
const orderConfirmation = require("../templates/orderConfirmation");

// ==========================
// Place Order
// ==========================

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
        paymentMethod,
        paymentStatus,
        deliveryMethod,
        deliveryCost
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: 'Order must contain at least one item'
        });
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
            subtotal,
            discount,
            total
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const subtotal = total;
        const discount = 0;

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
                paymentStatus || "pending",
                subtotal,
                discount,
                total
            ],
            async function (err) {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                const orderId = this.lastID;

                const itemSql = `
                INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    product_name,
                    quantity,
                    price
                )
                VALUES (?,?,?,?,?)
                `;

                const stmt = db.prepare(itemSql);

                items.forEach(item => {

                    stmt.run(
                        orderId,
                        item.id,
                        item.name,
                        item.quantity,
                        item.price
                    );

                });

                stmt.finalize();

                // ==========================
                // Send Confirmation Email
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

                                discount,

                                total,

                                paymentMethod,

                                deliveryMethod,

                                address,

                                currency: "£"

                            })

                        });

                    }

                } catch (emailError) {

                    console.error("Email Error:", emailError);

                }

                res.json({

                    success: true,

                    orderId,

                    message: "Order placed successfully"

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

            // Attach each order's line items (order_items was never being
            // joined back in before, so the admin UI could never show what
            // was actually purchased)
            const orderIds = orders.map(o => o.id);
            const placeholders = orderIds.map(() => '?').join(',');

            db.all(
                `
                SELECT
                    order_id,
                    product_id AS id,
                    product_name AS name,
                    quantity,
                    price
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
                            id: row.id,
                            name: row.name,
                            quantity: row.quantity,
                            price: row.price
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

            res.json({
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