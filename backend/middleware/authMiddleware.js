const jwt = require('jsonwebtoken');

const JWT_SECRET = require('../utils/jwtSecret');

module.exports = (req, res, next) => {

    // The browser app now authenticates via an httpOnly cookie (can't be
    // read or stolen by JS/XSS). The Authorization header is kept as a
    // fallback purely for non-browser API clients (Postman, curl, the
    // Swagger "Authorize" button) that can't rely on cookies.
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    const token = (req.cookies && req.cookies.token) || headerToken;

    if (!token) {

        return res.status(401).json({
            error: 'Access denied'
        });

    }

    try {

        req.user =
            jwt.verify(
                token,
                JWT_SECRET
            );

        next();

    }
    catch (err) {

        return res.status(401).json({
            error: 'Invalid token'
        });

    }

};