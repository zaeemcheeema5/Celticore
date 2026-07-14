const stripe = require("../utils/stripeClient");
const db = require("../db");

exports.stripeWebhook = async (req, res) => {

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

        case "checkout.session.completed":

            const session = event.data.object;

            const orderId = session.metadata.orderId;

            db.run(
                `
                UPDATE orders
                SET
                    status = 'Paid',
                    payment_method = 'Stripe'
                WHERE id = ?
                `,
                [orderId],
                (err) => {

                    if (err)
                        console.error(err);

                    else
                        console.log("Order Paid:", orderId);
                }
            );

            break;

        case "checkout.session.expired":

            console.log("Checkout expired");

            break;

        case "payment_intent.payment_failed":

            console.log("Payment Failed");

            break;

        default:

            console.log("Unhandled event:", event.type);

    }

    res.json({
        received: true
    });

};