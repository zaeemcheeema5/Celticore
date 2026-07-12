const stripe = require("../utils/stripeClient");
const db = require("../db");

exports.stripeWebhook = async (req, res) => {

    if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET.includes("your_webhook_signing_secret")) {
        // Webhook endpoint not yet configured in the Stripe dashboard for this
        // deployment — not required for checkout to work (placeOrder verifies
        // the PaymentIntent directly), this is optional defense-in-depth for
        // cases where the client's confirmation call never reaches the server.
        console.warn("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set — ignoring.");
        return res.status(200).json({ received: true, skipped: true });
    }

    const sig = req.headers["stripe-signature"];

    let event;

    try {

        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (err) {

        console.error("Webhook Error:", err.message);

        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {

        case "payment_intent.succeeded": {

            // The active embedded checkout (Stripe Elements + PaymentIntent)
            // fires this event, not checkout.session.completed below.
            const intent = event.data.object;

            db.run(
                `
                UPDATE orders
                SET
                    status = 'Paid',
                    payment_status = 'paid',
                    paid_at = CURRENT_TIMESTAMP
                WHERE stripe_payment_intent = ? AND status != 'Paid'
                `,
                [intent.id],
                (err) => {

                    if (err)
                        console.error(err);
                    else
                        console.log("Order confirmed paid via webhook for intent:", intent.id);
                }
            );

            break;
        }

        case "payment_intent.payment_failed": {

            const intent = event.data.object;

            db.run(
                `
                UPDATE orders
                SET payment_status = 'failed'
                WHERE stripe_payment_intent = ?
                `,
                [intent.id],
                (err) => {
                    if (err) console.error(err);
                }
            );

            console.log("Payment failed for intent:", intent.id);

            break;
        }

        case "checkout.session.completed": {

            // Legacy path — kept for backwards compatibility with the unused
            // Stripe Checkout Session flow (paymentController.createCheckoutSession).
            const session = event.data.object;
            const orderId = session.metadata && session.metadata.orderId;

            if (orderId) {
                db.run(
                    `UPDATE orders SET status = 'Paid', payment_status = 'paid' WHERE id = ?`,
                    [orderId],
                    (err) => {
                        if (err) console.error(err);
                        else console.log("Order Paid:", orderId);
                    }
                );
            }

            break;
        }

        case "checkout.session.expired":

            console.log("Checkout expired");

            break;

        default:

            console.log("Unhandled event:", event.type);

    }

    res.json({
        received: true
    });

};
