const { wrapEmail, ctaButton } = require("./_emailLayout");

module.exports = ({
    customerName = "there",
    orderId,
    amount,
    retryUrl,
    supportEmail = "support@theCeltiCore.com",
    currency = "€"
}) => {
    const bodyHtml = `
<p>Hi ${customerName},</p>
<p>We're sorry — your payment${orderId ? ` for order <strong>#${orderId}</strong>` : ""} couldn't be processed.</p>

${amount ? `
<table cellpadding="0" cellspacing="0" style="margin:18px 0;background:#f8f8f8;border-radius:8px;width:100%;">
<tr><td style="padding:14px 18px;">
<div style="font-size:11px;text-transform:uppercase;color:#999999;letter-spacing:1px;">Amount</div>
<div style="font-size:16px;font-weight:bold;color:#111111;margin-top:2px;">${currency}${Number(amount).toFixed(2)}</div>
</td></tr>
</table>
` : ""}

<p>This can happen for a few reasons — insufficient funds, an expired card, or your bank declining the charge. No charge has been made to your account.</p>

${ctaButton("Retry Payment", retryUrl, "#EF4444")}

<p style="margin-top:24px;">Need help? Contact us at <a href="mailto:${supportEmail}" style="color:#10B981;">${supportEmail}</a>.</p>
<p>Regards,<br><strong>CeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Payment Failed",
        heading: "We couldn't process your payment",
        accent: "#EF4444",
        bodyHtml
    });
};