const nodemailer = require("nodemailer");

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // Port 587 uses STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send Email
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            // CHANGE THIS LINE: Use EMAIL_FROM instead of SMTP_USER
            from: process.env.EMAIL_FROM, 
            to,
            subject,
            html,
        });

        console.log("✅ Email sent:", info.messageId);

        return {
            success: true,
            messageId: info.messageId,
        };

    } catch (error) {
        console.error("❌ Email Error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

module.exports = sendEmail;