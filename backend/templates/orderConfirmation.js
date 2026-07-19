module.exports = ({
    customerName,
    orderId,
    items,
    subtotal,
    discount,
    total,
    paymentMethod,
    deliveryMethod,
    address,
    currency = "€"
}) => {

    const products = items.map(item => `
        <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">
                ${item.product_name}
            </td>

            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">
                ${item.quantity}
            </td>

            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
                ${currency}${Number(item.price).toFixed(2)}
            </td>
        </tr>
    `).join("");

    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Order Confirmation</title>

</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">

<tr>

<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="background:white;margin-top:30px;border-radius:8px;overflow:hidden;">

<tr>

<td
style="background:#111827;padding:25px;text-align:center;color:white;">

<h1 style="margin:0;">CeltiCore</h1>

<p style="margin-top:10px;">
Premium Sports Nutrition
</p>

</td>

</tr>

<tr>

<td style="padding:35px;">

<h2>Hello ${customerName},</h2>

<p>

Thank you for shopping with
<strong>CeltiCore</strong>.

Your order has been received successfully.

</p>

<p>

<strong>Order ID:</strong>

#${orderId}

</p>

<h3>Order Summary</h3>

<table width="100%"
style="border-collapse:collapse;">

<tr style="background:#f4f4f4;">

<th align="left" style="padding:10px;">
Product
</th>

<th style="padding:10px;">
Qty
</th>

<th align="right" style="padding:10px;">
Price
</th>

</tr>

${products}

</table>

<br>

<table width="100%">

<tr>

<td>Subtotal</td>

<td align="right">
${currency}${Number(subtotal).toFixed(2)}
</td>

</tr>

<tr>

<td>Discount</td>

<td align="right">
${currency}${Number(discount).toFixed(2)}
</td>

</tr>

<tr>

<td>

<strong>Total</strong>

</td>

<td align="right">

<strong>
${currency}${Number(total).toFixed(2)}
</strong>

</td>

</tr>

</table>

<hr>

<p>

<b>Payment Method:</b>

${paymentMethod}

</p>

<p>

<b>Delivery Method:</b>

${deliveryMethod}

</p>

<p>

<b>Shipping Address:</b>

${address}

</p>

<br>

<div
style="padding:20px;background:#f8f8f8;border-radius:8px;">

<h3>What's Next?</h3>

<ul>

<li>Your order is being prepared.</li>

<li>You'll receive another email when it ships.</li>

<li>Track your order from your account.</li>

</ul>

</div>

<br>

<p>

Thank you for choosing
<strong>CeltiCore</strong>.

</p>

<p>

Regards,

<br>

<b>CeltiCore Team</b>

</p>

</td>

</tr>

<tr>

<td
style="background:#111827;color:white;padding:20px;text-align:center;">

© ${new Date().getFullYear()}

CeltiCore

<br>

support@celticore.com

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>

`;
};