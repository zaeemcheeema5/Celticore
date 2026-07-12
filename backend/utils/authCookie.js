// Centralizes the cookie options used everywhere a login endpoint issues a
// token, so they can't drift out of sync (e.g. one endpoint forgetting
// `httpOnly` while another has it).
//
// httpOnly: true   — JavaScript (and therefore any XSS payload) can never
//                     read this cookie's value. This is the whole point of
//                     the change: previously the JWT sat in localStorage,
//                     fully readable by any script running on the page.
// sameSite: 'lax'  — the cookie isn't sent on cross-site requests initiated
//                     by other sites (basic CSRF protection), but still
//                     works for normal top-level navigation.
// secure: true in production — only sent over HTTPS once deployed.
const isProd = (process.env.NODE_ENV || "development") === "production";

const COOKIE_NAME = "token";

function setAuthCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24h — matches the JWT's own expiresIn
        path: "/"
    });
}

function clearAuthCookie(res) {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/"
    });
}

module.exports = { setAuthCookie, clearAuthCookie, COOKIE_NAME };
