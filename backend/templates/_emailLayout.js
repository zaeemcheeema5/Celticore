// ==========================
// Shared CeltiCore Email Layout
// ==========================
// Every transactional email (order shipped, delivered, cancelled, payment
// success/failed, welcome, etc.) is built by wrapping its own inner content
// in this shell, so all emails share one consistent, on-brand look instead
// of each template re-implementing the same header/footer markup.
//
// Kept intentionally simple/table-based (no flexbox/grid) since that's what
// reliably renders across email clients (Outlook, Gmail, Apple Mail).

const BRAND = {
    name: "CeltiCore",
    tagline: "Premium Sports Nutrition",
    accent: "#10B981", // emerald — matches the site's brand accent
    dark: "#0c0c0c",
    supportEmail: "support@theCeltiCore.com"
};

/**
 * @param {Object} opts
 * @param {string} opts.title        - Small eyebrow label above the heading (e.g. "ORDER SHIPPED")
 * @param {string} opts.heading      - Main heading text
 * @param {string} opts.bodyHtml     - Inner HTML for the email body (already-built markup)
 * @param {string} [opts.accent]     - Override accent color for this specific email (defaults to brand emerald)
 */
function wrapEmail({ title, heading, bodyHtml, accent = BRAND.accent }) {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${heading || BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">

<!-- Header -->
<tr>
<td style="background:${BRAND.dark};padding:28px 30px;text-align:center;">
<span style="display:inline-block;font-size:22px;font-weight:900;letter-spacing:1px;color:#ffffff;text-transform:uppercase;">${BRAND.name}</span>
<div style="margin-top:4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${accent};">${BRAND.tagline}</div>
</td>
</tr>

<!-- Accent bar -->
<tr><td style="background:${accent};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

<!-- Eyebrow + Heading -->
${title || heading ? `
<tr>
<td style="padding:32px 30px 0 30px;">
${title ? `<div style="font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${accent};margin-bottom:6px;">${title}</div>` : ""}
${heading ? `<h1 style="margin:0;font-size:22px;color:#111111;">${heading}</h1>` : ""}
</td>
</tr>
` : ""}

<!-- Body -->
<tr>
<td style="padding:20px 30px 34px 30px;color:#333333;font-size:14px;line-height:1.6;">
${bodyHtml}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:${BRAND.dark};color:#ffffff;padding:22px 30px;text-align:center;font-size:11px;">
© ${new Date().getFullYear()} ${BRAND.name}<br>
<a href="mailto:${BRAND.supportEmail}" style="color:${accent};text-decoration:none;">${BRAND.supportEmail}</a>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`;
}

// Small reusable pieces every template can share:

function ctaButton(label, url, accent = BRAND.accent) {
    if (!url) return "";
    return `
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:22px 0;">
<tr>
<td style="border-radius:6px;background:${accent};">
<a href="${url}" style="display:inline-block;padding:12px 26px;font-size:13px;font-weight:bold;letter-spacing:0.5px;color:#0c0c0c;text-decoration:none;border-radius:6px;">
${label}
</a>
</td>
</tr>
</table>
`;
}

function itemsTable(items = [], currency = "€") {
    const rows = (items || []).map(item => `
<tr>
<td style="padding:10px 0;border-bottom:1px solid #eeeeee;">
${item.name || item.product_name}${item.flavour ? ` <span style="color:#999999;">(${item.flavour})</span>` : ""}
</td>
<td style="padding:10px 0;border-bottom:1px solid #eeeeee;text-align:center;">x${item.quantity}</td>
<td style="padding:10px 0;border-bottom:1px solid #eeeeee;text-align:right;">${currency}${Number(item.price * item.quantity).toFixed(2)}</td>
</tr>
`).join("");

    return `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;">
<tr style="color:#999999;font-size:11px;text-transform:uppercase;">
<td style="padding-bottom:6px;">Product</td>
<td style="padding-bottom:6px;text-align:center;">Qty</td>
<td style="padding-bottom:6px;text-align:right;">Price</td>
</tr>
${rows}
</table>
`;
}

module.exports = { BRAND, wrapEmail, ctaButton, itemsTable };