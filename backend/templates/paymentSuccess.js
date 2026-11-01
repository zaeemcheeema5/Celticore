const { wrapEmail } = require("./_emailLayout");

module.exports = ({
    customerName,
    orderId,
    amountPaid,
    paymentMethod,
    address,
    currency = "€"
}) => {
    const bodyHtml = `
<p>Hi ${customerName},</p>
<p>Thank you — your payment for order <strong>#${orderId}</strong> was successful.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:#f8f8f8;border-radius:8px;">
<tr>
<td style="padding:14px 18px;">
<table width="100%">
<tr><td style="color:#666666;padding:4px 0;">Order ID</td><td style="text-align:right;font-weight:bold;">#${orderId}</td></tr>
<tr><td style="color:#666666;padding:4px 0;">Amount Paid</td><td style="text-align:right;font-weight:bold;">${currency}${Number(amountPaid).toFixed(2)}</td></tr>
<tr><td style="color:#666666;padding:4px 0;">Payment Method</td><td style="text-align:right;font-weight:bold;text-transform:capitalize;">${paymentMethod}</td></tr>
${address ? `<tr><td style="color:#666666;padding:4px 0;vertical-align:top;">Delivery Address</td><td style="text-align:right;">${address}</td></tr>` : ""}
</table>
</td>
</tr>
</table>

<p>This email serves as your receipt. Please keep it for your records.</p>
<p style="margin-top:24px;">Thanks for shopping with us.</p>
<p>Regards,<br><strong>CeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Payment Successful",
        heading: "Payment received ✅",
        bodyHtml
    });
};