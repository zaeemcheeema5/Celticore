const { wrapEmail, ctaButton } = require("./_emailLayout");

module.exports = ({ username, shopUrl }) => {
    const bodyHtml = `
<p>Hi ${username},</p>
<p>Welcome to <strong>theCeltiCore</strong> — your account has been created successfully.</p>
<p>You can now check out faster, track your orders, and save products to your wishlist.</p>

${ctaButton("Start Shopping", shopUrl)}

<p style="margin-top:24px;">Regards,<br><strong>theCeltiCore Team</strong></p>
`;

    return wrapEmail({
        title: "Welcome",
        heading: "Welcome to theCeltiCore 👋",
        bodyHtml
    });
};