const jwt = require('jsonwebtoken');

// Must match the secret used to SIGN tokens in authController.js / settingsController.js.
// Previously hardcoded to a literal that did not match process.env.JWT_SECRET ("celticore"),
// which caused every valid token to fail verification here.
const JWT_SECRET =
    process.env.JWT_SECRET || 'your_jwt_secret_key_123';

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith('Bearer ')
    ) {

        return res.status(401).json({
            error: 'Access denied'
        });

    }

    const token =
        authHeader.split(' ')[1];

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