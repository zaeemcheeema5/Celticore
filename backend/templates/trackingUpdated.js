const { wrapEmail, ctaButton, itemsTable, deliveryDetailsBlock } = require("./_emailLayout");

module.exports = ({
    customerName,
    orderId,
    items = [],
    status,
    deliveryMethodName,
    estimatedDays,
    address,
    courierName,
    trackingNumber,
    trackingUrl,
    trackOrderUrl,
    currency = "€"
}) => {
    const bodyHtml = `
<p>Hi ${customerName},</p>
<p>The tracking details for your order <strong>#${orderId}</strong> have been updated.</p>

${deliveryDetailsBlock({
        status,
        deliveryMethodName,
        estimatedDays,
        address,
        courierName,
        trackingNumber,
        trackingUrl
    })}

<h3 style="margin:22px 0 4px 0;font-size:14px;">Items</h3>
${itemsTable(items, currency)}

${ctaButton("View My Order", trackOrderUrl)}

<p style="margin-top:24px;">Thanks for shopping with us.</p>
<p>Regards,<br><strong>CeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Tracking Updated",
        heading: "Your tracking details were updated",
        bodyHtml
    });
};
