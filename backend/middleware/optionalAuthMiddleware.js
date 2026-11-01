const jwt = require('jsonwebtoken');

const JWT_SECRET = require('../utils/jwtSecret');

// Same token lookup as authMiddleware.js, but never blocks the request.
// Used on routes that must keep working for guests (checkout) while still
// linking the order to a logged-in customer's account when one exists.
module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    const token = (req.cookies && req.cookies.token) || headerToken;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        req.user = null;
    }

    next();
};