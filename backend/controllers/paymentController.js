const stripe = require("../utils/stripeClient");
const db = require("../db");
const { resolveCheckoutDelivery, toCents } = require("../utils/delivery");

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
        paymentIntentId,
        receipt_email
        // NOTE: `currency` from the request body is deliberately ignored.
        // Previously the client could choose the currency, so a shopper could
        // pay "49.99" in a weaker currency than the EUR price shown. The
        // currency is now fixed on the server.
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: "An 'items' array of { id, quantity } is required to calculate the charge"
        });
    }

    try {

        // 1) Product prices + coupon, recalculated from the database
        //    (same function placeOrder uses, so both always agree).
        const { recomputeOrderPricing } = require("./orderController");

        let pricing;
        try {
            pricing = await recomputeOrderPricing(
                items.map(i => ({ product_id: i && i.id, quantity: i && i.quantity })),
                couponCode
            );
        } catch (pricingErr) {
            return res.status(pricingErr.status || 500).json({
                error: pricingErr.message || "Could not calculate order pricing."
            });
        }

        const { subtotal, discount } = pricing;
        const goodsTotal = Math.max(0, subtotal - discount);

        // 2) Delivery fee: customers don't choose a method — the business-
        //    defined one is applied and priced on the server (fixed nationwide
        //    fee, free over the configured minimum).
        let delivery;
        try {
            delivery = await resolveCheckoutDelivery(goodsTotal);
        } catch (deliveryErr) {
            return res.status(deliveryErr.status || 500).json({
                error: deliveryErr.message || "Could not calculate delivery."
            });
        }

        // 3) Final payable amount, in cents. Final = Subtotal - Discount + Delivery.
        const amount = toCents(goodsTotal) + toCents(delivery.fee);
        const total = amount / 100;

        if (amount <= 0) {
            return res.status(400).json({
                error: "Order total must be greater than zero"
            });
        }

        const currency = (process.env.STORE_CURRENCY || "eur").toLowerCase();

        const metadata = {
            source: "celticore_checkout",
            subtotal: subtotal.toFixed(2),
            discount: discount.toFixed(2),
            delivery_method: delivery.code,
            delivery_fee: delivery.fee.toFixed(2),
            total: total.toFixed(2),
            couponCode: couponCode || ""
        };

        const responseBody = (intent) => ({
            success: true,
            clientSecret: intent.client_secret,
            paymentIntentId: intent.id,
            amount,
            subtotal,
            discount,
            deliveryMethod: delivery.code,
            deliveryFee: delivery.fee,
            deliveryFree: delivery.freeApplied,
            total
        });

        // 4) The shopper changed delivery method / cart / coupon AFTER the
        //    payment form was created: update that same PaymentIntent instead
        //    of creating another one (no orphan or duplicate intents). Only
        //    intents created by this checkout and still waiting for a payment
        //    method can be updated; anything else falls through to "create".
        if (paymentIntentId && typeof paymentIntentId === "string" && paymentIntentId.startsWith("pi_")) {
            try {
                const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

                if (
                    existing.metadata &&
                    existing.metadata.source === "celticore_checkout" &&
                    existing.status === "requires_payment_method" &&
                    existing.currency === currency
                ) {
                    const unchanged =
                        existing.amount === amount &&
                        existing.metadata.delivery_method === metadata.delivery_method &&
                        existing.metadata.delivery_fee === metadata.delivery_fee &&
                        existing.metadata.discount === metadata.discount &&
                        existing.metadata.couponCode === metadata.couponCode;

                    const updated = unchanged
                        ? existing
                        : await stripe.paymentIntents.update(existing.id, {
                            amount,
                            metadata,
                            receipt_email: receipt_email || undefined
                        });

                    return res.json(responseBody(updated));
                }
            } catch (lookupErr) {
                // Unknown / unusable intent id — just create a fresh one below.
                console.warn("Could not reuse PaymentIntent, creating a new one:", lookupErr.message);
            }
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            receipt_email: receipt_email || undefined,
            // Lets Stripe automatically surface payment methods enabled in
            // the Stripe Dashboard inside the same embedded
            // <PaymentElement/> on the frontend — card, Google Pay, Apple
            // Pay, and Link all "just work".
            //
            // `allow_redirects: "never"` restricts that to methods that
            // settle inline, without a redirect.
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
            metadata
        });

        res.json(responseBody(paymentIntent));

    } catch (e) {

        res.status(500).json({
            error: e.message
        });

    }

};

/*
-------------------------------------
LEGACY: Stripe Checkout Session for an EXISTING order
-------------------------------------
The website uses the PaymentIntent flow above; this is kept only so the old
route keeps working. It now charges exactly what the order was verified to
cost when it was placed (products - discount + delivery, stored in
orders.total), in EUR, as one line. It never rebuilds the price from client
data and never uses any other currency.
*/
exports.createCheckoutSession = async (req, res) => {

    try {

        const orderId = req.body && req.body.orderId;

        if (!orderId) {
            return res.status(400).json({ error: "Order ID is required" });
        }

        const rows = await new Promise((resolve, reject) => {
            db.all("SELECT id, total, status, payment_status FROM orders WHERE id = ?", [orderId],
                (err, r) => (err ? reject(err) : resolve(r)));
        });
        const order = rows && rows[0];

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const status = String(order.status || "").toLowerCase();
        if (String(order.payment_status || "").toLowerCase() === "paid" ||
            !["pending", ""].includes(status)) {
            return res.status(400).json({ error: "This order cannot be paid online." });
        }

        const amount = toCents(Number(order.total));
        if (!Number.isInteger(amount) || amount < 50) {
            return res.status(400).json({ error: "Order total is invalid." });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [{
                price_data: {
                    currency: (process.env.STORE_CURRENCY || "eur").toLowerCase(),
                    product_data: { name: `CeltiCore order #${order.id}` },
                    unit_amount: amount
                },
                quantity: 1
            }],
            success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
            metadata: { orderId: String(order.id) }
        });

        await new Promise((resolve, reject) => {
            db.run("UPDATE orders SET stripe_session_id = ? WHERE id = ?", [session.id, order.id],
                (err) => (err ? reject(err) : resolve()));
        });

        res.json({ success: true, url: session.url, sessionId: session.id });

    } catch (e) {
        console.error("Checkout session error:", e.message);
        res.status(500).json({ error: "Could not start payment." });
    }
};
