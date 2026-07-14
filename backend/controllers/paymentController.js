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
*/
exports.createPaymentIntent = async (req, res) => {

    const {
        amount,
        currency,
        receipt_email
    } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
            error: "A positive integer 'amount' (in the smallest currency unit, e.g. pence) is required"
        });
    }

    try {

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: (currency || process.env.STORE_CURRENCY || "gbp").toLowerCase(),
            receipt_email: receipt_email || undefined,
            automatic_payment_methods: {
                enabled: true
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret
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