const { wrapEmail, ctaButton, itemsTable } = require("./_emailLayout");

module.exports = ({
    customerName,
    orderId,
    items = [],
    total,
    estimatedDelivery,
    trackOrderUrl,
    currency = "€"
}) => {
    const bodyHtml = `
<p>Hi ${customerName},</p>
<p>Good news — your order <strong>#${orderId}</strong> is on its way!</p>

${estimatedDelivery ? `
<table cellpadding="0" cellspacing="0" style="margin:18px 0;background:#f8f8f8;border-radius:8px;width:100%;">
<tr><td style="padding:14px 18px;">
<div style="font-size:11px;text-transform:uppercase;color:#999999;letter-spacing:1px;">Estimated Delivery</div>
<div style="font-size:16px;font-weight:bold;color:#111111;margin-top:2px;">${estimatedDelivery}</div>
</td></tr>
</table>
` : ""}

<h3 style="margin:22px 0 4px 0;font-size:14px;">Order Summary</h3>
${itemsTable(items, currency)}
<table width="100%" style="margin-top:10px;">
<tr>
<td style="font-weight:bold;padding-top:8px;border-top:1px solid #eeeeee;">Grand Total</td>
<td style="font-weight:bold;padding-top:8px;border-top:1px solid #eeeeee;text-align:right;">${currency}${Number(total).toFixed(2)}</td>
</tr>
</table>

${ctaButton("Track My Order", trackOrderUrl)}

<p style="margin-top:24px;">Thanks for shopping with us.</p>
<p>Regards,<br><strong>CeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Order Shipped",
        heading: "Your order is on the way 🚚",
        bodyHtml
    });
};