const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/*
=====================================
JWT SECRET — single validated source (utils/jwtSecret.js).
Throws at startup if unset or weak, instead of silently allowing
admin login with a guessable/known-default secret.
=====================================
*/
const JWT_SECRET = require('../utils/jwtSecret');
const { setAuthCookie } = require('../utils/authCookie');

/*
=====================================
GET SETTINGS
=====================================
*/
exports.getSettings = (req, res) => {

    db.all(
        'SELECT * FROM settings',
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            const settings = {};

            // Never echo secrets back in a JSON response, even to an
            // authenticated admin — admin_password/openai_api_key/etc are
            // write-only from the API's perspective.
            const secretKeys = new Set([
                'admin_password',
                'stripe_secret_key',
                'openai_api_key'
            ]);

            rows.forEach(row => {
                if (!secretKeys.has(row.key)) {
                    settings[row.key] = row.value;
                }
            });

            res.json({
                success: true,
                settings
            });
        }
    );
};

/*
=====================================
UPDATE SETTINGS
=====================================
*/
exports.updateSettings = (req, res) => {

    const settings = req.body;

    // Validate currency if provided
    if (settings.currency) {

        const allowedCurrencies = [
            'GBP',
            'USD',
            'EUR',
            'PKR'
        ];

        const currency =
            settings.currency.toUpperCase();

        if (!allowedCurrencies.includes(currency)) {

            return res.status(400).json({
                success: false,
                error: 'Invalid currency'
            });
        }

        settings.currency = currency;
    }

    db.serialize(() => {

        const stmt = db.prepare(`
            INSERT OR REPLACE INTO settings
            (key, value)
            VALUES (?, ?)
        `);

        Object.keys(settings).forEach(key => {

            stmt.run(
                key,
                settings[key]
            );

        });

        stmt.finalize(err => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    error: err.message
                });

            }

            res.json({

                success: true,
                message: 'Settings updated successfully',
                settings

            });

        });

    });

};

/*
=====================================
ADMIN LOGIN
=====================================
*/
exports.adminLogin = (req, res) => {

    if (!JWT_SECRET) {
        return res.status(500).json({
            success: false,
            error: 'Server misconfiguration: JWT_SECRET is not set'
        });
    }

    const { username, password } = req.body;

    db.all(
        `
        SELECT key, value
        FROM settings
        WHERE key IN ('admin_username', 'admin_password')
        `,
        [],
        async (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            const settings = {};

            rows.forEach(row => {
                settings[row.key] = row.value;
            });

            if (username !== settings.admin_username) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password'
                });
            }

            let passwordMatched = false;

            // Supports both hashed and plain-text passwords
            if (
                settings.admin_password &&
                settings.admin_password.startsWith('$2')
            ) {
                passwordMatched = await bcrypt.compare(
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
                    message: 'Invalid username or password'
                });
            }

            const token = jwt.sign(
                {
                    username: settings.admin_username,
                    role: 'admin'
                },
                JWT_SECRET,
                {
                    expiresIn: '24h'
                }
            );

            // Sets the same httpOnly cookie the main /api/auth/login flow
            // uses. The response body still includes `token` below too,
            // kept for backward compatibility with any existing caller of
            // this endpoint that reads it directly.
            setAuthCookie(res, token);

            // Update last_login timestamp
            const lastLogin = new Date().toISOString();

            db.run(
                `
                INSERT OR REPLACE INTO settings
                (key, value)
                VALUES ('last_login', ?)
                `,
                [lastLogin],
                (updateErr) => {

                    if (updateErr) {
                        // Don't block login on this failing —
                        // just log it and continue
                        console.error(
                            'Failed to update last_login:',
                            updateErr.message
                        );
                    }

                    res.json({
                        success: true,
                        message: 'Login successful',
                        token,
                        last_login: lastLogin
                    });

                }
            );

        }
    );

};

/*
=====================================
GET ADMIN PROFILE
=====================================
*/
exports.getAdminProfile = (req, res) => {

    db.all(

        `
        SELECT key, value
        FROM settings
        WHERE key IN
        (
            'admin_username',
            'admin_email',
            'admin_phone',
            'admin_avatar',
            'last_login',

            'store_name',
            'store_logo',
            'store_phone',
            'store_address',
            'support_email',
            'currency'
        )
        `,

        [],

        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    error: err.message
                });

            }

            const profile = {};

            rows.forEach(row => {

                profile[row.key] = row.value;

            });

            res.json({

                success: true,

                profile

            });

        }

    );

};

/*
=====================================
STRIPE PAYMENT INTENT
=====================================
*/
exports.createPaymentIntent = async (req, res) => {

    const { amount } = req.body;

    if (!amount) {

        return res.status(400).json({
            success: false,
            error: 'Amount is required'
        });
    }

    db.all(
        `
        SELECT key,value
        FROM settings
        WHERE key IN
        (
            'stripe_secret_key',
            'currency'
        )
        `,
        [],
        async (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            const settings = {};

            rows.forEach(row => {
                settings[row.key] = row.value;
            });

            const stripeSecret =
                settings.stripe_secret_key;

            const currency =
                (settings.currency || 'GBP')
                .toLowerCase();

            if (!stripeSecret) {

                return res.status(400).json({
                    success: false,
                    error: 'Stripe secret key not configured'
                });
            }

            try {

                const stripe =
                    require('stripe')(stripeSecret);

                const paymentIntent =
                    await stripe.paymentIntents.create({

                        amount:
                            Math.round(amount * 100),

                        currency,

                        automatic_payment_methods: {
                            enabled: true
                        }
                    });

                res.json({
                    success: true,
                    clientSecret:
                        paymentIntent.client_secret,
                    currency
                });

            } catch (error) {

                console.error(error);

                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    );
};

/*
=====================================
ID SCHEME FOR THE COMBINED ACCOUNTS DIRECTORY
=====================================
The frontend's "Admins" tab shows one merged table of the master admin,
secondary admins, and customers, then round-trips whatever `id` it was given
back to DELETE /api/settings/users/:id. The master admin isn't a database row
(it's the admin_* keys in `settings`), and secondary admins (`admins` table)
and customers (`users` table) both use their own auto-increment integers, so
without prefixing, an admin id and a customer id could collide. Every id
returned from getUsers is therefore one of:
  'main-admin'   — the single master admin (never deletable)
  'admin-<id>'   — a row in the `admins` table
  'customer-<id>'— a row in the `users` table
*/

const dbAll = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });

const dbGet = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });

/*
=====================================
GET ACCOUNTS DIRECTORY (master admin + secondary admins + customers)
=====================================
*/
exports.getUsers = async (req, res) => {

    try {

        const [adminRows, customerRows, emailRow, usernameRow] = await Promise.all([
            dbAll(`SELECT id, username, email, created_at FROM admins ORDER BY created_at DESC`),
            dbAll(`SELECT id, username, email, created_at FROM users ORDER BY created_at DESC`),
            dbGet(`SELECT value FROM settings WHERE key = 'admin_email'`),
            dbGet(`SELECT value FROM settings WHERE key = 'admin_username'`)
        ]);

        const masterAdmin = {
            id: 'main-admin',
            username: usernameRow?.value || 'Administrator',
            email: emailRow?.value || '',
            role: 'main_admin',
            createdAt: null
        };

        const admins = adminRows.map(a => ({
            id: `admin-${a.id}`,
            username: a.username,
            email: a.email,
            role: 'admin',
            createdAt: a.created_at
        }));

        const customers = customerRows.map(u => ({
            id: `customer-${u.id}`,
            username: u.username,
            email: u.email,
            role: 'customer',
            createdAt: u.created_at
        }));

        res.json({
            success: true,
            users: [masterAdmin, ...admins, ...customers]
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};

/*
=====================================
CREATE SECONDARY ADMIN PROFILE (main_admin only)
=====================================
*/
exports.createAdminProfile = async (req, res) => {

    if (!req.admin || req.admin.role !== 'main_admin') {
        return res.status(403).json({
            success: false,
            message: 'Only the master administrator can create admin profiles.'
        });
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username, email and password are required.'
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO admins (username, email, password) VALUES (?, ?, ?)`,
            [username, email, hashedPassword],
            function (err) {

                if (err) {

                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({
                            success: false,
                            message: 'An admin with that username or email already exists.'
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });

                }

                res.json({
                    success: true,
                    message: 'Admin profile created successfully.',
                    admin: {
                        id: `admin-${this.lastID}`,
                        username,
                        email,
                        role: 'admin'
                    }
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};

/*
=====================================
DELETE ACCOUNT (admin or customer, by prefixed id)
=====================================
Enforcement mirrors the rules the frontend already displays, but applied
server-side since the frontend's canDelete check is UI-only and doesn't
stop a direct API call:
  - the master admin can never be deleted
  - only a main_admin can delete another admin account
  - any admin can delete a customer account
*/
exports.deleteUser = (req, res) => {

    const rawId = req.params.id;

    if (rawId === 'main-admin') {
        return res.status(403).json({
            success: false,
            message: 'The master administrator account cannot be deleted.'
        });
    }

    if (rawId.startsWith('admin-')) {

        if (!req.admin || req.admin.role !== 'main_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only the master administrator can delete admin accounts.'
            });
        }

        const id = rawId.slice('admin-'.length);

        return db.run(`DELETE FROM admins WHERE id = ?`, [id], function (err) {

            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Admin not found.' });
            }

            res.json({ success: true, message: 'Admin account deleted successfully.' });

        });

    }

    if (rawId.startsWith('customer-')) {

        const id = rawId.slice('customer-'.length);

        return db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {

            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            res.json({ success: true, message: 'User deleted successfully.' });

        });

    }

    return res.status(400).json({
        success: false,
        message: 'Unrecognized account id.'
    });

};

/*
=====================================
UPDATE MY OWN ADMIN CREDENTIALS
=====================================
main_admin updates the settings-backed master credentials; a secondary
admin updates their own row in the `admins` table (matched via the id
carried in their own JWT, not a param — this endpoint only ever updates
the caller's own account).
*/
exports.updateAdminCredentials = async (req, res) => {

    if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { username, email, password } = req.body;

    if (!username && !email && !password) {
        return res.status(400).json({
            success: false,
            message: 'Provide at least one field to update.'
        });
    }

    try {

        if (req.admin.role === 'main_admin') {

            const updates = [];
            if (username) updates.push(['admin_username', username]);
            if (email) updates.push(['admin_email', email]);
            if (password) updates.push(['admin_password', await bcrypt.hash(password, 10)]);

            db.serialize(() => {

                const stmt = db.prepare(
                    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`
                );

                updates.forEach(([key, value]) => stmt.run(key, value));

                stmt.finalize(err => {

                    if (err) {
                        return res.status(500).json({ success: false, error: err.message });
                    }

                    res.json({
                        success: true,
                        message: 'Master admin credentials updated successfully.'
                    });

                });

            });

            return;

        }

        // Secondary admin updating their own profile
        const fields = [];
        const values = [];

        if (username) { fields.push('username = ?'); values.push(username); }
        if (email) { fields.push('email = ?'); values.push(email); }
        if (password) { fields.push('password = ?'); values.push(await bcrypt.hash(password, 10)); }

        values.push(req.admin.id);

        db.run(
            `UPDATE admins SET ${fields.join(', ')} WHERE id = ?`,
            values,
            function (err) {

                if (err) {

                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({
                            success: false,
                            message: 'That username or email is already taken.'
                        });
                    }

                    return res.status(500).json({ success: false, error: err.message });

                }

                if (this.changes === 0) {
                    return res.status(404).json({ success: false, message: 'Admin account not found.' });
                }

                res.json({ success: true, message: 'Credentials updated successfully.' });

            }
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

};