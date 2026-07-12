const rateLimit = require("express-rate-limit");

// Nothing in this app previously throttled repeated requests at all —
// /login, /signup, /verify-otp (a 6-digit, ~1M-combination code) and
// /admin-login could all be hit as fast as the network allows, with no
// lockout. That makes credential stuffing, password guessing, and OTP
// brute-forcing (900,000 possible codes, no attempt limit, 10-minute
// window) all practically feasible with a simple script.

// Tight limiter for the highest-value targets: login and OTP verification.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too many attempts. Please try again in a few minutes."
    }
});

// Slightly looser limiter for account-creation / OTP-request endpoints,
// which are more likely to be hit by legitimate retries.
const requestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too many requests. Please try again in a few minutes."
    }
});

// Broad, generous limiter applied to the whole API as a baseline defense
// against scripted abuse/scraping — well above normal browsing traffic.
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too many requests. Please slow down."
    }
});

module.exports = { authLimiter, requestLimiter, apiLimiter };
