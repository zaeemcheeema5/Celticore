// backend/middleware/validateContact.js
//
// The contact form (POST /api/contact) previously accepted any request body
// and inserted it straight into the database with no checks at all — no
// required-field check, no email format check, no length limits. That meant
// empty submissions, garbage data, and oversized payloads (a multi-megabyte
// "message" field, for example) could all be stored without complaint, and
// the endpoint could be scripted for spam with nothing to slow it down
// beyond the site-wide rate limiter.
//
// This middleware validates the four fields the form actually collects
// before the request ever reaches the controller/database.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
    name: 100,
    email: 254, // RFC 5321 max mailbox length
    subject: 150,
    message: 2000
};

function validateContact(req, res, next) {
    const errors = [];
    const body = req.body || {};

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name) errors.push("Name is required.");
    else if (name.length > LIMITS.name) errors.push(`Name must be ${LIMITS.name} characters or fewer.`);

    if (!email) errors.push("Email is required.");
    else if (email.length > LIMITS.email) errors.push("Email address is too long.");
    else if (!EMAIL_RE.test(email)) errors.push("Please enter a valid email address.");

    if (subject && subject.length > LIMITS.subject) errors.push(`Subject must be ${LIMITS.subject} characters or fewer.`);

    if (!message) errors.push("Message is required.");
    else if (message.length > LIMITS.message) errors.push(`Message must be ${LIMITS.message} characters or fewer.`);

    if (errors.length) {
        return res.status(400).json({
            success: false,
            error: errors[0],
            errors
        });
    }

    // Pass the trimmed values through so the controller stores clean data.
    req.body.name = name;
    req.body.email = email;
    req.body.subject = subject || "General Inquiry";
    req.body.message = message;

    next();
}

module.exports = validateContact;