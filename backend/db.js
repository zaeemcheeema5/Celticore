const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

/*
=====================================
MYSQL CONNECTION POOL
=====================================
Reads connection details from backend/.env — see .env.example / the
"Deploying to Hostinger" notes for where to get these from hPanel
(Databases > MySQL Databases): DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
*/
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Keep DATETIME/TIMESTAMP columns as plain strings (e.g. "2026-07-19
    // 10:00:00") instead of JS Date objects, matching how sqlite3 returned
    // them — several controllers do things like `new Date(user.otp_expiry)`
    // which works either way, but this keeps existing string comparisons
    // (e.g. ISO string equality checks) behaving the same as before.
    dateStrings: true
});

const promisePool = pool.promise();

/*
=====================================
SQLITE-COMPATIBLE WRAPPER
=====================================
The whole app was written against sqlite3's callback API: db.run/get/all,
db.serialize, and db.prepare()/stmt.run()/stmt.finalize() with `this.lastID`
/ `this.changes` inside db.run's callback. Rather than rewriting every
controller's SQL calls, this wrapper exposes the exact same shape backed by
mysql2 underneath, so controllers didn't need to change at all.
*/

// sqlite3 has "INSERT OR IGNORE" / "INSERT OR REPLACE"; MySQL's equivalents
// are "INSERT IGNORE" / "REPLACE". Translated centrally here so no
// controller's SQL string needed editing.
function translateSql(sql) {
    return sql
        .replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT IGNORE')
        .replace(/INSERT\s+OR\s+REPLACE/gi, 'REPLACE')
        .replace(/(?<!`)\bkey\b(?!`)/g, '`key`');
}

function run(sql, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }
    pool.query(translateSql(sql), params || [], function (err, result) {
        if (typeof callback !== 'function') {
            if (err) console.error(err);
            return;
        }
        if (err) return callback.call({}, err);
        // Mirrors sqlite3: inside db.run's callback, `this.lastID` is the
        // auto-increment id of the inserted row and `this.changes` is the
        // number of affected rows.
        callback.call(
            { lastID: result.insertId, changes: result.affectedRows },
            null
        );
    });
}

function get(sql, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }
    pool.query(translateSql(sql), params || [], function (err, rows) {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

function all(sql, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }
    pool.query(translateSql(sql), params || [], function (err, rows) {
        if (err) return callback(err);
        callback(null, rows);
    });
}

// sqlite3's serialize() queues callbacks to run in order on a single
// connection. Every place this app uses it either nests its follow-up work
// inside a callback already (so ordering is guaranteed regardless), or uses
// db.prepare()/stmt.finalize() below (which now waits for every queued
// statement to finish before firing its own callback) — so simply invoking
// the function is sufficient here.
function serialize(fn) {
    if (typeof fn === 'function') fn();
}

function prepare(sql) {
    const translated = translateSql(sql);
    const pending = [];

    const stmt = {
        run(...args) {
            // sqlite3 supports stmt.run(param1, param2, ...) and
            // stmt.run([param1, param2, ...]) — both are used across this
            // codebase, so both are handled here.
            const params =
                args.length === 1 && Array.isArray(args[0])
                    ? args[0]
                    : args;

            pending.push(
                new Promise((resolve, reject) => {
                    pool.query(translated, params, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                })
            );

            return stmt;
        },

        finalize(callback) {
            Promise.all(pending)
                .then(() => {
                    if (typeof callback === 'function') callback(null);
                })
                .catch(err => {
                    if (typeof callback === 'function') callback(err);
                    else console.error('Statement finalize error:', err);
                });
        }
    };

    return stmt;
}

const db = { run, get, all, serialize, prepare };

/*
=====================================
SCHEMA
=====================================
Notes on types changed from the original SQLite schema:
  - INTEGER PRIMARY KEY AUTOINCREMENT -> INT PRIMARY KEY AUTO_INCREMENT
  - Any TEXT column that's a PRIMARY KEY, UNIQUE, or referenced by a
    FOREIGN KEY had to become VARCHAR(n) — MySQL can't index/constrain a
    full TEXT column without an explicit key-length prefix. This affects:
    products.id, categories.name/slug, admins.username/email,
    users.username/email, coupons.code, settings.key, and the product_id
    columns in order_items/reviews/wishlist (kept as VARCHAR(255) to match
    products.id).
  - REAL -> DOUBLE (MySQL's name for the same type; avoids relying on the
    REAL_AS_FLOAT sql_mode default).
  - This is a fresh schema for a brand-new MySQL database, so all the
    incremental "ALTER TABLE ADD COLUMN" migrations that existed for
    upgrading older SQLite installs have been folded directly into each
    CREATE TABLE below — there's no old MySQL install to migrate from yet.
*/

async function initSchema() {

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            name TEXT NOT NULL,
            subtitle TEXT,
            brand TEXT,
            category TEXT,
            price DOUBLE,
            original_price DOUBLE,
            image TEXT,
            description TEXT,
            badge TEXT,
            flavours TEXT,
            rating DOUBLE DEFAULT 0,
            reviews INT DEFAULT 0,
            stock_quantity INT DEFAULT 0,
            low_stock_threshold INT DEFAULT 5,
            is_active INT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) UNIQUE NOT NULL,
            slug VARCHAR(255) UNIQUE,
            image TEXT,
            card_image TEXT,
            tagline TEXT,
            description TEXT,
            accent_color VARCHAR(32) DEFAULT '#10b981',
            effect VARCHAR(64) DEFAULT 'energy',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // The master/main admin is NOT a row here — it remains the single
    // admin_username/admin_email/admin_password credential set stored in
    // `settings`. Rows in this table are secondary admin profiles a
    // main_admin can create from the dashboard's "Admins" tab; they always
    // carry role 'admin' (never 'main_admin').
    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS admins (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(255) UNIQUE,
            email VARCHAR(255) UNIQUE,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(255) UNIQUE,
            email VARCHAR(255) UNIQUE,
            password TEXT,
            reset_otp VARCHAR(16),
            otp_expiry DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT PRIMARY KEY AUTO_INCREMENT,
            customer_name TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            postal_code TEXT,
            country TEXT,
            delivery_method TEXT,
            delivery_cost DOUBLE DEFAULT 0,
            meetup_point TEXT,
            timeslot TEXT,
            payment_method TEXT,
            payment_status VARCHAR(32) DEFAULT 'pending',
            stripe_session_id VARCHAR(255),
            stripe_payment_intent VARCHAR(255),
            subtotal DOUBLE,
            discount DOUBLE DEFAULT 0,
            total DOUBLE,
            tracking_number TEXT,
            notes TEXT,
            is_sameday INT DEFAULT 0,
            sameday_area TEXT,
            status VARCHAR(32) DEFAULT 'Pending',
            paid_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INT PRIMARY KEY AUTO_INCREMENT,
            order_id INT,
            product_id VARCHAR(255),
            product_name TEXT,
            quantity INT,
            price DOUBLE,
            flavour TEXT,
            FOREIGN KEY(order_id) REFERENCES orders(id)
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INT PRIMARY KEY AUTO_INCREMENT,
            product_id VARCHAR(255),
            user_id INT,
            rating INT,
            comment TEXT,
            status VARCHAR(32) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(product_id) REFERENCES products(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS wishlist (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            product_id VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name TEXT,
            email TEXT,
            subject TEXT,
            message TEXT,
            status VARCHAR(32) DEFAULT 'unread',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS coupons (
            id INT PRIMARY KEY AUTO_INCREMENT,
            code VARCHAR(100) UNIQUE,
            discount_type VARCHAR(32),
            discount_value DOUBLE,
            minimum_order DOUBLE DEFAULT 0,
            usage_limit INT DEFAULT 100,
            used_count INT DEFAULT 0,
            expiry_date VARCHAR(64),
            is_active INT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS nutrition_requests (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name TEXT,
            phone TEXT,
            email TEXT,
            age INT,
            gender TEXT,
            weight DOUBLE,
            height DOUBLE,
            goal TEXT,
            activity_level TEXT,
            diet_preference TEXT,
            medical_conditions TEXT,
            notes TEXT,
            status VARCHAR(32) DEFAULT 'Pending',
            admin_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS chatbot_knowledge (
            id INT PRIMARY KEY AUTO_INCREMENT,
            question TEXT,
            answer TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            -- Opaque, unguessable per-session token required to read chat
            -- history. The session's own auto-increment id is sequential/
            -- enumerable, so using it alone would let anyone iterate
            -- ?sessionId=1,2,3... and read other people's chat transcripts.
            session_token VARCHAR(64),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INT PRIMARY KEY AUTO_INCREMENT,
            session_id INT,
            role VARCHAR(16),
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS faq (
            id INT PRIMARY KEY AUTO_INCREMENT,
            question TEXT,
            answer TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS analytics (
            id INT PRIMARY KEY AUTO_INCREMENT,
            page TEXT,
            visits INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS settings (
            \`key\` VARCHAR(100) PRIMARY KEY,
            value TEXT
        )
    `);

    // ==========================
    // DEFAULT SETTINGS
    // Default admin password is hashed before it ever touches the DB. This
    // is still a well-known default credential (admin@celticore.com /
    // password123) shipped in the repo, so it MUST be changed via
    // Settings > Admin Credentials immediately after first deploy.
    // ==========================
    const defaultSettings = [
        ['stripe_public_key', ''],
        ['stripe_secret_key', ''],

        ['bank_name', ''],
        ['account_number', ''],
        ['account_title', ''],

        ['easypaisa_number', ''],
        ['easypaisa_name', ''],

        ['enable_card', '1'],
        ['enable_bank', '1'],
        ['enable_easypaisa', '0'],
        ['enable_cod', '1'],

        ['enable_sameday', '0'],

        ['admin_password', bcrypt.hashSync('password123', 10)],
        ['admin_name', 'Administrator'],
        ['admin_email', 'admin@celticore.com'],
        ['admin_phone', ''],
        ['admin_avatar', ''],
        ['last_login', ''],

        ['store_name', 'CeltiCore'],
        ['store_logo', ''],
        ['store_phone', ''],
        ['store_address', ''],
        ['support_email', 'support@celticore.com'],
        ['currency', 'EUR'],

        ['chatbot_enabled', '0'],
        ['openai_api_key', '']
    ];

    for (const [key, value] of defaultSettings) {
        await promisePool.query(
            'INSERT IGNORE INTO settings (`key`, value) VALUES (?, ?)',
            [key, value]
        );
    }
}

initSchema()
    .then(() => {
        console.log('✅ MySQL schema ready');
    })
    .catch(err => {
        console.error('❌ Failed to initialize MySQL schema:', err.message);
        process.exit(1);
    });

module.exports = db;
