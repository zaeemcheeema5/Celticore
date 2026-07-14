const stripe = require("../utils/stripeClient");
const db = require("../db");

/*
=====================================
CREATE PAYMENT INTENT (public, customer checkout)
=====================================
Used by the embedded Stripe <CardElement> flow in CheckoutModal.tsx.
This is separate from settingsController.createPaymentIntent, which is an
admin-only utility that reads the Stripe secret key from the settings table.
This one always uses the server's STRIPE_SECRET_KEY env var via utils/stripeClient.js
and requires no authentication, since checkout must work for guests too.

SECURITY NOTE: the amount charged is always recalculated here from the
`products` table (and, if present, a live coupon lookup) rather than trusted
from the client. Previously this endpoint just charged whatever `amount` the
browser sent — trivially editable via devtools/network tools to charge
pennies for a full cart.
*/
exports.createPaymentIntent = async (req, res) => {

    const {
        items,
        couponCode,
        currency,
        receipt_email
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: "An 'items' array of { id, quantity } is required to calculate the charge"
        });
    }

    try {

        const productIds = [...new Set(items.map(i => i.id))];
        const placeholders = productIds.map(() => "?").join(",");

        const products = await new Promise((resolve, reject) => {
            db.all(
                `SELECT id, price FROM products WHERE id IN (${placeholders})`,
                productIds,
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        const priceById = {};
        products.forEach(p => { priceById[p.id] = p.price; });

        let subtotal = 0;

        for (const item of items) {
            const price = priceById[item.id];
            const quantity = Number(item.quantity);

            if (price === undefined || !Number.isFinite(quantity) || quantity <= 0) {
                return res.status(400).json({
                    error: `Invalid item in cart (product id: ${item.id})`
                });
            }

            subtotal += price * quantity;
        }

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
                    discount = (subtotal * coupon.discount_value) / 100;
                } else if (coupon.discount_type === "fixed") {
                    discount = coupon.discount_value;
                }
            }
        }

        const total = Math.max(0, subtotal - discount);
        const amount = Math.round(total * 100);

        if (amount <= 0) {
            return res.status(400).json({
                error: "Order total must be greater than zero"
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: (currency || process.env.STORE_CURRENCY || "gbp").toLowerCase(),
            receipt_email: receipt_email || undefined,
            payment_method_types: ["card"],
            metadata: {
                subtotal: subtotal.toFixed(2),
                discount: discount.toFixed(2),
                total: total.toFixed(2),
                couponCode: couponCode || ""
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount,
            subtotal,
            discount,
            total
        });

    } catch (e) {

        res.status(500).json({
            error: e.message
        });

    }

};

exports.createCheckoutSession = (req, res) => {

    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({
            error: "Order ID is required"
        });
    }

    db.get(
        "SELECT value FROM settings WHERE key='currency'",
        [],
        (err, currencyRow) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            const currency = (
                currencyRow?.value || "GBP"
            ).toLowerCase();

            db.get(
                `
                SELECT *
                FROM orders
                WHERE id=?
                `,
                [orderId],
                (err, order) => {

                    if (err)
                        return res.status(500).json({
                            error: err.message
                        });

                    if (!order)
                        return res.status(404).json({
                            error: "Order not found"
                        });

                    db.all(
                        `
                        SELECT *
                        FROM order_items
                        WHERE order_id=?
                        `,
                        [orderId],
                        async (err, items) => {

                            if (err)
                                return res.status(500).json({
                                    error: err.message
                                });

                            try {

                                const lineItems = items.map(item => ({

                                    price_data: {

                                        currency,

                                        product_data: {

                                            name: item.product_name

                                        },

                                        unit_amount:
                                            Math.round(item.price * 100)

                                    },

                                    quantity: item.quantity

                                }));

                                const session =
                                    await stripe.checkout.sessions.create({

                                        payment_method_types: ["card"],

                                        mode: "payment",

                                        line_items: lineItems,

                                        success_url:
                                            `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

                                        cancel_url:
                                            `${process.env.CLIENT_URL}/payment-cancel`,

                                        metadata: {

                                            orderId: order.id

                                        }

                                    });

                                db.run(
                                    `
                                    UPDATE orders
                                    SET stripe_session_id=?
                                    WHERE id=?
                                    `,
                                    [
                                        session.id,
                                        order.id
                                    ]
                                );

                                res.json({

                                    success: true,

                                    url: session.url,

                                    sessionId: session.id

                                });

                            } catch (e) {

                                res.status(500).json({

                                    error: e.message

                                });

                            }

                        }
                    );

                }
            );

        }
    );

};