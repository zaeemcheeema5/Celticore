const { wrapEmail } = require("./_emailLayout");

module.exports = ({
    customerName,
    orderId,
    total,
    refundStatus,
    supportEmail = "support@theCeltiCore.com",
    currency = "€"
}) => {
    const bodyHtml = `
<p>Hi ${customerName},</p>
<p>Your order <strong>#${orderId}</strong> has been cancelled.</p>

<table cellpadding="0" cellspacing="0" style="margin:18px 0;background:#f8f8f8;border-radius:8px;width:100%;">
<tr><td style="padding:14px 18px;">
<div style="font-size:11px;text-transform:uppercase;color:#999999;letter-spacing:1px;">Order Total</div>
<div style="font-size:16px;font-weight:bold;color:#111111;margin-top:2px;">${currency}${Number(total).toFixed(2)}</div>
</td></tr>
<tr><td style="padding:0 18px 14px 18px;">
<div style="font-size:11px;text-transform:uppercase;color:#999999;letter-spacing:1px;">Refund Status</div>
<div style="font-size:14px;color:#111111;margin-top:2px;">${refundStatus}</div>
</td></tr>
</table>

<p>If you have any questions about this cancellation, our team is happy to help.</p>
<p>Contact us at <a href="mailto:${supportEmail}" style="color:#10B981;">${supportEmail}</a>.</p>

<p style="margin-top:24px;">Regards,<br><strong>theCeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Order Cancelled",
        heading: "Your order has been cancelled",
        accent: "#EF4444",
        bodyHtml
    });
};