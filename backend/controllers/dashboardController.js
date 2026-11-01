const db = require('../db');


// DASHBOARD STATS
//
// PREVIOUSLY: db.serialize() (backend/db.js) is a no-op passthrough left
// over from the sqlite3-compatibility shim — it does not actually run
// callbacks in order. The 11 db.get() calls below each pull their own
// connection from the MySQL pool and run concurrently, but the response
// was being sent from inside the *last* call's callback (the revenue sum),
// assuming every other stat had already finished writing into `stats` by
// then. There's no guarantee of that: under load, or simply because one
// query is faster than another, the revenue query could resolve before
// e.g. the low-stock or pending-reviews count does. When that happened the
// response went out with that field still `undefined`, which silently
// became `0` in the JSON body (via `row?.total || 0`) instead of an error —
// admins could see incorrect zeroed-out stats with nothing to indicate
// anything had gone wrong.
//
// FIX: run every query as a real Promise (via db.execute, the mysql2
// promise-pool path already exposed by db.js) and wait for all of them
// with Promise.all before responding, so the response is only ever built
// from fully-resolved data.
exports.getDashboardStats = async (req, res) => {

    try {

        const queries = {
            totalProducts:
                "SELECT COUNT(*) as total FROM products",
            totalOrders:
                "SELECT COUNT(*) as total FROM orders",
            totalUsers:
                "SELECT COUNT(*) as total FROM users",
            totalMessages:
                "SELECT COUNT(*) as total FROM contact_messages",
            totalNutritionRequests:
                "SELECT COUNT(*) as total FROM nutrition_requests",
            pendingOrders:
                "SELECT COUNT(*) as total FROM orders WHERE LOWER(status) = 'pending'",
            completedOrders:
                "SELECT COUNT(*) as total FROM orders WHERE LOWER(status) = 'completed'",
            lowStockProducts:
                "SELECT COUNT(*) as total FROM products WHERE stock_quantity <= low_stock_threshold",
            pendingReviews:
                "SELECT COUNT(*) AS total FROM reviews WHERE LOWER(status) = 'pending'",
            pendingNutrition:
                "SELECT COUNT(*) AS total FROM nutrition_requests WHERE LOWER(status) = 'pending'",
            unreadMessages:
                // contact_messages has no boolean `read` column — it tracks
                // this via a `status` VARCHAR column (default 'unread', set
                // to 'read' by contactController.markRead). The previous
                // query ("WHERE read = 0") referenced a column that never
                // existed in the schema (db.js's contact_messages table
                // definition) and was a MySQL/MariaDB syntax error on top of
                // that ('read' is also a reserved word). The old per-
                // callback code never checked this specific query's `err`,
                // so it silently showed 0 instead of the real unread count;
                // the Promise.all rewrite above surfaces the error properly,
                // which is what exposed this pre-existing bug.
                "SELECT COUNT(*) AS total FROM contact_messages WHERE status = 'unread'"
        };

        const keys = Object.keys(queries);

        const results = await Promise.all(
            keys.map(async (key) => {
                const [rows] = await db.execute(queries[key], []);
                return rows[0]?.total || 0;
            })
        );

        const stats = {};
        keys.forEach((key, i) => { stats[key] = results[i]; });

        const [revenueRows] = await db.execute(
            "SELECT SUM(total) as revenue FROM orders",
            []
        );

        stats.totalRevenue = revenueRows[0]?.revenue || 0;

        res.json(stats);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};


// SALES REPORT

exports.getSalesReport = (req, res) => {

    db.all(
        `
        SELECT
            DATE(created_at) as date,
            COUNT(*) as orders,
            SUM(total) as revenue
        FROM orders
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
};


// TOP SELLING PRODUCTS

exports.getTopProducts = (req, res) => {

    db.all(
        `
        SELECT
            product_name,
            SUM(quantity) as total_sold
        FROM order_items
        GROUP BY product_name
        ORDER BY total_sold DESC
        LIMIT 10
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
};


// LOW STOCK PRODUCTS

exports.getLowStockProducts = (req, res) => {

    db.all(
        `
        SELECT *
        FROM products
        WHERE stock_quantity <= low_stock_threshold
        ORDER BY stock_quantity ASC
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
};


// RECENT ORDERS

exports.getRecentOrders = (req, res) => {

    db.all(
        `
        SELECT *
        FROM orders
        ORDER BY created_at DESC
        LIMIT 10
        `,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
};