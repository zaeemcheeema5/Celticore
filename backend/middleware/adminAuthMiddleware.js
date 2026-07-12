const jwt = require("jsonwebtoken");

const JWT_SECRET = require("../utils/jwtSecret");

module.exports = (req, res, next) => {

    // Same dual-source read as authMiddleware.js — cookie for the browser
    // app, Authorization header as a fallback for non-browser API clients.
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const token = (req.cookies && req.cookies.token) || headerToken;

    if (!token) {

        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });

    }

    try {

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        if (decoded.role !== "admin" && decoded.role !== "main_admin") {

            return res.status(403).json({
                success: false,
                message: "Admin access only."
            });

        }

        req.admin = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }

};