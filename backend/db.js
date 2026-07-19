const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'nutrova.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {

    // ==========================
    // PRODUCTS
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        price REAL,
        image TEXT,
        description TEXT,
        rating REAL DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // CATEGORIES
    // ==========================
    db.run(`
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT UNIQUE NOT NULL,

    slug TEXT UNIQUE,

    image TEXT,

    card_image TEXT,

    tagline TEXT,

    description TEXT,

    accent_color TEXT DEFAULT '#10b981',

    effect TEXT DEFAULT 'energy',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
    `);

    db.run(`
ALTER TABLE categories
ADD COLUMN tagline TEXT
`, (err) => {
    if (
        err &&
        !err.message.includes("duplicate column name")
    ) {
        console.error(err.message);
    }
});

    // ==========================
    // ADMINS (secondary admin accounts)
    // ==========================
    // The master/main admin is NOT a row here — it remains the single
    // admin_username/admin_email/admin_password credential set stored in
    // `settings`. Rows in this table are the secondary admin profiles a
    // main_admin can create from the dashboard's "Admins" tab; they always
    // carry role 'admin' (never 'main_admin').
    db.run(`
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);


   db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,

    reset_otp TEXT,
    otp_expiry DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
// ==========================
// USERS PASSWORD RESET COLUMNS
// ==========================

db.run(`
ALTER TABLE users
ADD COLUMN reset_otp TEXT
`, (err) => {
    if (
        err &&
        !err.message.includes("duplicate column name")
    ) {
        console.error(err.message);
    }
});

db.run(`
ALTER TABLE users
ADD COLUMN otp_expiry DATETIME
`, (err) => {
    if (
        err &&
        !err.message.includes("duplicate column name")
    ) {
        console.error(err.message);
    }
});

    // ==========================
    // ORDERS
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        customer_name TEXT,
        email TEXT,
        phone TEXT,

        address TEXT,
        city TEXT,
        country TEXT,

        delivery_method TEXT,

        meetup_point TEXT,
        timeslot TEXT,

        payment_method TEXT,

        subtotal REAL,
        discount REAL DEFAULT 0,
        total REAL,

        tracking_number TEXT,
        notes TEXT,

        is_sameday INTEGER DEFAULT 0,
        sameday_area TEXT,

        status TEXT DEFAULT 'Pending',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);
// ==========================
// UPDATE ORDERS TABLE (Stripe)
// ==========================

const addColumn = (sql) => {
    db.run(sql, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error(err.message);
        }
    });
};

addColumn(`
ALTER TABLE orders
ADD COLUMN payment_status TEXT DEFAULT 'pending'
`);

addColumn(`
ALTER TABLE orders
ADD COLUMN stripe_session_id TEXT
`);

addColumn(`
ALTER TABLE orders
ADD COLUMN stripe_payment_intent TEXT
`);

addColumn(`
ALTER TABLE orders
ADD COLUMN paid_at DATETIME
`);

// ==========================
// UPDATE ORDERS TABLE (fields the frontend Order type sends
// but the original schema never had a column for)
// ==========================

addColumn(`
ALTER TABLE orders
ADD COLUMN postal_code TEXT
`);

addColumn(`
ALTER TABLE orders
ADD COLUMN delivery_cost REAL DEFAULT 0
`);
// ==========================
// UPDATE PRODUCTS TABLE
// ==========================

addColumn(`
ALTER TABLE products
ADD COLUMN subtitle TEXT
`);

addColumn(`
ALTER TABLE products
ADD COLUMN original_price REAL
`);

addColumn(`
ALTER TABLE products
ADD COLUMN badge TEXT
`);

addColumn(`
ALTER TABLE products
ADD COLUMN flavours TEXT
`);
    // ==========================
    // ORDER ITEMS
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id TEXT,
        product_name TEXT,
        quantity INTEGER,
        price REAL,
        flavour TEXT,

        FOREIGN KEY(order_id)
        REFERENCES orders(id)
    )
    `);

    addColumn(`
ALTER TABLE order_items
ADD COLUMN flavour TEXT
`);

    // ==========================
    // REVIEWS
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT,
        user_id INTEGER,
        rating INTEGER,
        comment TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(product_id)
        REFERENCES products(id),

        FOREIGN KEY(user_id)
        REFERENCES users(id)
    )
    `);

    // ==========================
    // WISHLIST
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(user_id)
        REFERENCES users(id),

        FOREIGN KEY(product_id)
        REFERENCES products(id)
    )
    `);

    // ==========================
    // CONTACT MESSAGES
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        subject TEXT,
        message TEXT,
        status TEXT DEFAULT 'unread',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // COUPONS
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,

        discount_type TEXT,
        discount_value REAL,

        minimum_order REAL DEFAULT 0,

        usage_limit INTEGER DEFAULT 100,
        used_count INTEGER DEFAULT 0,

        expiry_date TEXT,

        is_active INTEGER DEFAULT 1,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);
    
db.run(`
CREATE TABLE IF NOT EXISTS nutrition_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT,
    phone TEXT,
    email TEXT,

    age INTEGER,
    gender TEXT,

    weight REAL,
    height REAL,

    goal TEXT,
    activity_level TEXT,

    diet_preference TEXT,
    medical_conditions TEXT,
    notes TEXT,

    status TEXT DEFAULT 'Pending',
    admin_notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

addColumn(`
ALTER TABLE nutrition_requests
ADD COLUMN name TEXT
`);

addColumn(`
ALTER TABLE nutrition_requests
ADD COLUMN diet_preference TEXT
`);

addColumn(`
ALTER TABLE nutrition_requests
ADD COLUMN medical_conditions TEXT
`);

addColumn(`
ALTER TABLE nutrition_requests
ADD COLUMN notes TEXT
`);

    // ==========================
    // CHATBOT KNOWLEDGE
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS chatbot_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // CHAT SESSIONS
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // Opaque, unguessable per-session token — required to read chat history.
    // The session's own auto-increment id is sequential/enumerable, so using
    // it alone as the lookup key let anyone iterate ?sessionId=1,2,3... and
    // read other people's chat transcripts with zero authentication.
    db.run(`
    ALTER TABLE chat_sessions
    ADD COLUMN session_token TEXT
    `, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error(err.message);
        }
    });

    // ==========================
    // CHAT MESSAGES
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        role TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(session_id)
        REFERENCES chat_sessions(id)
    )
    `);

    // ==========================
    // FAQ
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // ==========================
    // ANALYTICS
    // ==========================
    db.run(`
    CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page TEXT,
        visits INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

  // ==========================
// SETTINGS
// ==========================
db.run(`
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
)
`);

const bcrypt = require('bcryptjs');

const defaultSettings = [

    // ==========================
    // STRIPE
    // ==========================
    ['stripe_public_key', ''],
    ['stripe_secret_key', ''],

    // ==========================
    // BANK DETAILS
    // ==========================
    ['bank_name', ''],
    ['account_number', ''],
    ['account_title', ''],

    // ==========================
    // EASYPAISA
    // ==========================
    ['easypaisa_number', ''],
    ['easypaisa_name', ''],

    // ==========================
    // PAYMENT METHODS
    // ==========================
    ['enable_card', '1'],
    ['enable_bank', '1'],
    ['enable_easypaisa', '0'],
    ['enable_cod', '1'],

    // ==========================
    // DELIVERY
    // ==========================
    ['enable_sameday', '0'],

    // ==========================
    // ADMIN
    // Default password is hashed before it ever touches the DB — a fresh
    // install previously stored 'password123' here in plaintext. This is
    // still a well-known default credential (admin@celticore.com /
    // password123) shipped in the repo, so it MUST be changed via
    // Settings > Admin Credentials immediately after first deploy.
    // ==========================
    ['admin_password', bcrypt.hashSync('password123', 10)],
    ['admin_name', 'Administrator'],
    ['admin_email', 'admin@celticore.com'],
    ['admin_phone', ''],
    ['admin_avatar', ''],
    ['last_login', ''],

    // ==========================
    // STORE INFORMATION
    // ==========================
    ['store_name', 'CeltiCore'],
    ['store_logo', ''],
    ['store_phone', ''],
    ['store_address', ''],
    ['support_email', 'support@celticore.com'],
    ['currency', 'EUR'],

    // ==========================
    // CHATBOT
    // ==========================
    ['chatbot_enabled', '0'],
    ['openai_api_key', '']

];

const stmt = db.prepare(
    `
    INSERT OR IGNORE INTO settings
    (key, value)
    VALUES (?, ?)
    `
);

defaultSettings.forEach(setting => {
    stmt.run(setting);
});

stmt.finalize();
// ==========================
// ADD NEW SETTINGS FOR EXISTING DATABASES
// ==========================

const newSettings = [

    ['admin_email', 'admin@celticore.com'],
    ['admin_phone', ''],
    ['admin_avatar', ''],
    ['last_login', ''],

    ['store_logo', ''],
    ['store_phone', ''],
    ['store_address', '']

];

const newStmt = db.prepare(
    `
    INSERT OR IGNORE INTO settings
    (key, value)
    VALUES (?, ?)
    `
);

newSettings.forEach(setting => {
    newStmt.run(setting);
});

newStmt.finalize();
});

module.exports = db;