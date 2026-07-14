const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sendEmail = require("../services/emailService");
const passwordResetTemplate = require("../templates/passwordReset");

const JWT_SECRET =
    process.env.JWT_SECRET || "your_jwt_secret_key_123";

// ======================
// SIGNUP
// ======================

exports.signup = async (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;

    if (!name || !email || !password) {

        return res.status(400).json({
            success: false,
            error: 'All fields are required'
        });

    }

    try {

        const hashedPassword =
            await bcrypt.hash(password, 10);

        db.run(

            `
            INSERT INTO users
            (
                username,
                email,
                password
            )
            VALUES
            (
                ?, ?, ?
            )
            `,

            [
                name,
                email,
                hashedPassword
            ],

            function (err) {

                if (err) {

                    if (err.message.includes('UNIQUE')) {

                        return res.status(400).json({

                            success: false,
                            error: 'Email already exists'

                        });

                    }

                    return res.status(500).json({

                        success: false,
                        error: err.message

                    });

                }

                const token = jwt.sign(

                    {
                        userId: this.lastID,
                        username: name,
                        email
                    },

                    JWT_SECRET,

                    {
                        expiresIn: '24h'
                    }

                );

                res.status(201).json({

                    success: true,

                    message: 'Account created successfully',

                    token,

                    role: "customer",

                    user: {

                        id: this.lastID,
                        name,
                        email

                    }

                });

            }

        );

    }

    catch (err) {

        res.status(500).json({

            success: false,
            error: err.message

        });

    }

};

// ======================
// LOGIN
// ======================

exports.login = async (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({

            success: false,
            error: 'Email and Password are required'

        });

    }

    // ======================
    // CHECK IF ADMIN LOGIN
    // ======================

    db.all(
        `
        SELECT key, value
        FROM settings
        WHERE key IN
        (
            'admin_email',
            'admin_password'
        )
        `,
        [],
        async (settingsErr, rows) => {

            if (settingsErr) {

                return res.status(500).json({
                    success: false,
                    error: settingsErr.message
                });

            }

            const settings = {};

            rows.forEach(row => {
                settings[row.key] = row.value;
            });

            // Admin Login
            if (email === settings.admin_email) {

                let passwordMatched = false;

                if (
                    settings.admin_password &&
                    settings.admin_password.startsWith("$2")
                ) {

                    passwordMatched =
                        await bcrypt.compare(
                            password,
                            settings.admin_password
                        );

                } else {

                    passwordMatched =
                        password === settings.admin_password;

                }

                if (!passwordMatched) {

                    return res.status(401).json({

                        success: false,
                        error: "Invalid email or password"

                    });

                }

                const token = jwt.sign(

                    {
                        role: "main_admin",
                        email
                    },

                    JWT_SECRET,

                    {
                        expiresIn: "24h"
                    }

                );

                return res.json({

                    success: true,

                    message: "Admin login successful",

                    token,

                    role: "main_admin",

                    user: {

                        name: "Administrator",

                        email,

                        role: "main_admin"

                    }

                });

            }

            // ======================
            // CHECK IF SECONDARY ADMIN LOGIN
            // ======================

            db.get(
                `SELECT * FROM admins WHERE email = ?`,
                [email],
                async (adminErr, secondaryAdmin) => {

                    if (adminErr) {
                        return res.status(500).json({
                            success: false,
                            error: adminErr.message
                        });
                    }

                    if (secondaryAdmin) {

                        const isMatch = await bcrypt.compare(
                            password,
                            secondaryAdmin.password
                        );

                        if (!isMatch) {
                            return res.status(401).json({
                                success: false,
                                error: "Invalid email or password"
                            });
                        }

                        const token = jwt.sign(
                            {
                                id: secondaryAdmin.id,
                                username: secondaryAdmin.username,
                                email: secondaryAdmin.email,
                                role: "admin"
                            },
                            JWT_SECRET,
                            { expiresIn: "24h" }
                        );

                        return res.json({
                            success: true,
                            message: "Admin login successful",
                            token,
                            role: "admin",
                            user: {
                                id: secondaryAdmin.id,
                                name: secondaryAdmin.username,
                                email: secondaryAdmin.email,
                                role: "admin"
                            }
                        });

                    }

                    // ======================
                    // FALL THROUGH TO CUSTOMER LOGIN
                    // ======================

                    db.get(

                        `
                        SELECT *
                        FROM users
                        WHERE email = ?
                        `,

                        [email],

                        async (err, user) => {

                            if (err) {

                                return res.status(500).json({

                                    success: false,
                                    error: err.message

                                });

                            }

                            if (!user) {

                                return res.status(401).json({

                                    success: false,
                                    error: 'Invalid email or password'

                                });

                            }

                            const isMatch =
                                await bcrypt.compare(
                                    password,
                                    user.password
                                );

                            if (!isMatch) {

                                return res.status(401).json({

                                    success: false,
                                    error: 'Invalid email or password'

                                });

                            }

                            const token = jwt.sign(

                                {
                                    userId: user.id,
                                    username: user.username,
                                    email: user.email,
                                    role: "customer"
                                },

                                JWT_SECRET,

                                {
                                    expiresIn: "24h"
                                }

                            );

                            res.json({

                                success: true,

                                message: "Login successful",

                                token,

                                role: "customer",

                                user: {

                                    id: user.id,

                                    name: user.username,

                                    email: user.email,

                                    role: "customer"

                                }

                            });

                        }

                    );

                }
            );

        }
    );

};

// ======================
// GET PROFILE
// ======================

exports.getProfile = (req, res) => {

    db.get(

        `
        SELECT
            id,
            username,
            email
        FROM users
        WHERE id = ?
        `,

        [req.user.userId],

        (err, user) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (!user) {

                return res.status(404).json({
                    error: 'User not found'
                });

            }

            res.json(user);

        }

    );

};
// ======================
// FORGOT PASSWORD
// ======================

exports.forgotPassword = (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required."
        });
    }

    db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        async (err, user) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            // Don't reveal whether the email exists
            if (!user) {
                return res.json({
                    success: true,
                    message: "If the email exists, an OTP has been sent."
                });
            }

            const otp = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            const expiry = new Date(
                Date.now() + 10 * 60 * 1000
            ).toISOString();

            db.run(
                `
                UPDATE users
                SET
                    reset_otp = ?,
                    otp_expiry = ?
                WHERE id = ?
                `,
                [
                    otp,
                    expiry,
                    user.id
                ],
                async function(updateErr) {

                    if (updateErr) {
                        return res.status(500).json({
                            success: false,
                            error: updateErr.message
                        });
                    }

                    await sendEmail({

                        to: user.email,

                        subject: "CeltiCore Password Reset OTP",

                        html: passwordResetTemplate({

                            username: user.username,

                            otp

                        })

                    });

                    res.json({

                        success: true,

                        message:
                            "If the email exists, an OTP has been sent."

                    });

                }

            );

        }

    );

};



// ======================
// VERIFY OTP
// ======================

exports.verifyOTP = (req, res) => {

    const { email, otp } = req.body;

    if (!email || !otp) {

        return res.status(400).json({

            success: false,

            message: "Email and OTP are required."

        });

    }

    db.get(

        `
        SELECT *
        FROM users
        WHERE email = ?
        `,

        [email],

        (err, user) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    error: err.message

                });

            }

            if (!user) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid email."

                });

            }

            if (user.reset_otp !== otp) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid OTP."

                });

            }

            if (new Date(user.otp_expiry) < new Date()) {

                return res.status(400).json({

                    success: false,

                    message: "OTP has expired."

                });

            }

            res.json({

                success: true,

                message: "OTP verified successfully."

            });

        }

    );

};



// ======================
// RESET PASSWORD
// ======================

exports.resetPassword = async (req, res) => {

    const {

        email,

        otp,

        password

    } = req.body;

    if (!email || !otp || !password) {

        return res.status(400).json({

            success: false,

            message: "Email, OTP and new password are required."

        });

    }

    db.get(

        `
        SELECT *
        FROM users
        WHERE email = ?
        `,

        [email],

        async (err, user) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    error: err.message

                });

            }

            if (!user) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid email."

                });

            }

            if (

                user.reset_otp !== otp ||

                new Date(user.otp_expiry) < new Date()

            ) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid or expired OTP."

                });

            }

            const hashedPassword =

                await bcrypt.hash(password, 10);

            db.run(

                `
                UPDATE users
                SET
                    password = ?,
                    reset_otp = NULL,
                    otp_expiry = NULL
                WHERE id = ?
                `,

                [

                    hashedPassword,

                    user.id

                ],

                function(updateErr) {

                    if (updateErr) {

                        return res.status(500).json({

                            success: false,

                            error: updateErr.message

                        });

                    }

                    res.json({

                        success: true,

                        message: "Password reset successfully."

                    });

                }

            );

        }

    );

};