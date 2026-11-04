const { wrapEmail, ctaButton, itemsTable, deliveryDetailsBlock } = require("./_emailLayout");

module.exports = ({
    customerName,
    orderId,
    items = [],
    total,
    deliveryMethodName,
    estimatedDays,
    address,
    trackOrderUrl,
    currency = "€"
}) => {
    const bodyHtml = `
<p>Hi ${customerName},</p>
<p>We're now preparing your order <strong>#${orderId}</strong>. We'll email you again as soon as it has been dispatched.</p>

${deliveryDetailsBlock({
        status: "Processing",
        deliveryMethodName,
        estimatedDays,
        address
    })}

<h3 style="margin:22px 0 4px 0;font-size:14px;">Order Summary</h3>
${itemsTable(items, currency)}
<table width="100%" style="margin-top:10px;">
<tr>
<td style="font-weight:bold;padding-top:8px;border-top:1px solid #eeeeee;">Grand Total</td>
<td style="font-weight:bold;padding-top:8px;border-top:1px solid #eeeeee;text-align:right;">${currency}${Number(total).toFixed(2)}</td>
</tr>
</table>

${ctaButton("View My Order", trackOrderUrl)}

<p style="margin-top:24px;">Thanks for shopping with us.</p>
<p>Regards,<br><strong>CeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Order Processing",
        heading: "We're preparing your order 📦",
        bodyHtml
    });
};
