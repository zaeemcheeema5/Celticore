const { wrapEmail, ctaButton, itemsTable } = require("./_emailLayout");

module.exports = ({
    customerName,
    orderId,
    items = [],
    total,
    deliveryDate,
    reviewUrl,
    currency = "€"
}) => {
    const bodyHtml = `
<p>Hi ${customerName},</p>
<p>Your order <strong>#${orderId}</strong> has been delivered${deliveryDate ? ` on <strong>${deliveryDate}</strong>` : ""}. We hope you enjoy it!</p>

<h3 style="margin:22px 0 4px 0;font-size:14px;">Order Details</h3>
${itemsTable(items, currency)}
<table width="100%" style="margin-top:10px;">
<tr>
<td style="font-weight:bold;padding-top:8px;border-top:1px solid #eeeeee;">Grand Total</td>
<td style="font-weight:bold;padding-top:8px;border-top:1px solid #eeeeee;text-align:right;">${currency}${Number(total).toFixed(2)}</td>
</tr>
</table>

<p style="margin-top:24px;">Let us know what you think — your review helps other athletes choose the right products.</p>
${ctaButton("Leave a Review", reviewUrl)}

<p style="margin-top:24px;">Thanks for choosing us.</p>
<p>Regards,<br><strong>CeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Order Delivered",
        heading: "Your order has arrived 📦",
        bodyHtml
    });
};