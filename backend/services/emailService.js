const nodemailer = require("nodemailer");

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // Port 587 uses STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send Email (low-level — used internally by the named helpers below, and
 * still exported directly for any existing call site that builds its own
 * HTML, e.g. passwordReset).
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });

        console.log("✅ Email sent:", info.messageId, "->", subject);

        return {
            success: true,
            messageId: info.messageId,
        };

    } catch (error) {
        console.error("❌ Email Error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// ==========================
// Templates
// ==========================
const orderConfirmationTemplate = require("../templates/orderConfirmation");
const orderShippedTemplate = require("../templates/orderShipped");
const orderDeliveredTemplate = require("../templates/orderDelivered");
const orderCancelledTemplate = require("../templates/orderCancelled");
const paymentSuccessTemplate = require("../templates/paymentSuccess");
const paymentFailedTemplate = require("../templates/paymentFailed");
const welcomeEmailTemplate = require("../templates/welcomeEmail");

const CLIENT_URL = process.env.CLIENT_URL || "";

/*
=====================================
Centralized, named send functions
=====================================
Controllers should only ever call one of these — they never build HTML
directly. Each function is best-effort: it logs and swallows its own
errors rather than throwing, since a failed notification email should
never fail the underlying order/payment/auth operation that triggered it.
*/

// Already used by orderController.placeOrder via the generic sendEmail()
// call — exposed here too so every event has a single, consistent entry
// point going forward.
const sendOrderConfirmation = async (order) => {
    if (!order.customerEmail) return { success: false, error: "No customer email" };

    return sendEmail({
        to: order.customerEmail,
        subject: `Order Confirmation #${order.orderId} - CeltiCore`,
        html: orderConfirmationTemplate(order)
    });
};

const sendOrderShipped = async (order) => {
    if (!order.customerEmail) return { success: false, error: "No customer email" };

    const today = new Date();
    const from = new Date(today); from.setDate(today.getDate() + 3);
    const to = new Date(today); to.setDate(today.getDate() + 5);
    const fmt = (d) => d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });

    return sendEmail({
        to: order.customerEmail,
        subject: `Your theCeltiCore Order #${order.orderId} Has Shipped 🚚`,
        html: orderShippedTemplate({
            customerName: order.customerName,
            orderId: order.orderId,
            items: order.items,
            total: order.total,
            estimatedDelivery: `${fmt(from)} - ${fmt(to)}`,
            trackOrderUrl: CLIENT_URL ? `${CLIENT_URL}/my-orders` : undefined,
        })
    });
};

const sendOrderDelivered = async (order) => {
    if (!order.customerEmail) return { success: false, error: "No customer email" };

    return sendEmail({
        to: order.customerEmail,
        subject: `Your theCeltiCore Order #${order.orderId} Has Been Delivered 📦`,
        html: orderDeliveredTemplate({
            customerName: order.customerName,
            orderId: order.orderId,
            items: order.items,
            total: order.total,
            deliveryDate: new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' }),
            reviewUrl: CLIENT_URL ? `${CLIENT_URL}/my-orders` : undefined,
        })
    });
};

const sendOrderCancelled = async (order) => {
    if (!order.customerEmail) return { success: false, error: "No customer email" };

    const wasPaid = order.paymentStatus === 'paid';

    return sendEmail({
        to: order.customerEmail,
        subject: `Your theCeltiCore Order #${order.orderId} Was Cancelled`,
        html: orderCancelledTemplate({
            customerName: order.customerName,
            orderId: order.orderId,
            total: order.total,
            refundStatus: wasPaid
                ? "Your payment will be refunded to your original payment method within 5-7 business days."
                : "No payment was taken for this order, so there is nothing to refund.",
        })
    });
};

const sendPaymentSuccess = async (order) => {
    if (!order.customerEmail) return { success: false, error: "No customer email" };

    return sendEmail({
        to: order.customerEmail,
        subject: `Payment Received - Order #${order.orderId} - CeltiCore`,
        html: paymentSuccessTemplate({
            customerName: order.customerName,
            orderId: order.orderId,
            amountPaid: order.total,
            paymentMethod: order.paymentMethod === 'gpay' ? 'Google Pay' : order.paymentMethod === 'applepay' ? 'Apple Pay' : 'Credit Card',
            address: order.address,
        })
    });
};

// `order` is optional here — a payment can fail before any order row
// exists (e.g. the card was declined at checkout, before placeOrder was
// ever called), so this can be sent from just the Stripe PaymentIntent's
// own `receipt_email` when there's no matching order.
const sendPaymentFailed = async ({ customerEmail, customerName, orderId, amount }) => {
    if (!customerEmail) return { success: false, error: "No customer email" };

    return sendEmail({
        to: customerEmail,
        subject: `Payment Failed${orderId ? ` - Order #${orderId}` : ''} - CeltiCore`,
        html: paymentFailedTemplate({
            customerName,
            orderId,
            amount,
            retryUrl: CLIENT_URL || undefined,
        })
    });
};

const sendWelcomeEmail = async ({ username, email }) => {
    if (!email) return { success: false, error: "No email" };

    return sendEmail({
        to: email,
        subject: `Welcome to theCeltiCore, ${username}!`,
        html: welcomeEmailTemplate({
            username,
            shopUrl: CLIENT_URL || undefined,
        })
    });
};

// Keep `require("../services/emailService")` callable directly (existing
// call sites in orderController/authController do this) while also
// exposing the named helpers as properties on the same export — no
// existing import needs to change.
module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.sendOrderConfirmation = sendOrderConfirmation;
module.exports.sendOrderShipped = sendOrderShipped;
module.exports.sendOrderDelivered = sendOrderDelivered;
module.exports.sendOrderCancelled = sendOrderCancelled;
module.exports.sendPaymentSuccess = sendPaymentSuccess;
module.exports.sendPaymentFailed = sendPaymentFailed;
module.exports.sendWelcomeEmail = sendWelcomeEmail;