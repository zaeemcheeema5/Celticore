const db = require('../db');


// DASHBOARD STATS

exports.getDashboardStats = (req, res) => {

    const stats = {};

    db.serialize(() => {

        db.get(
            'SELECT COUNT(*) as total FROM products',
            [],
            (err, row) => {
                stats.totalProducts = row?.total || 0;
            }
        );

        db.get(
            'SELECT COUNT(*) as total FROM orders',
            [],
            (err, row) => {
                stats.totalOrders = row?.total || 0;
            }
        );

        db.get(
            'SELECT COUNT(*) as total FROM users',
            [],
            (err, row) => {
                stats.totalUsers = row?.total || 0;
            }
        );

        db.get(
            'SELECT COUNT(*) as total FROM contact_messages',
            [],
            (err, row) => {
                stats.totalMessages = row?.total || 0;
            }
        );

        db.get(
            'SELECT COUNT(*) as total FROM nutrition_requests',
            [],
            (err, row) => {
                stats.totalNutritionRequests =
                    row?.total || 0;
            }
        );

        db.get(
            `
            SELECT COUNT(*) as total
            FROM orders
            WHERE LOWER(status) = 'pending'
            `,
            [],
            (err, row) => {
                stats.pendingOrders =
                    row?.total || 0;
            }
        );

        db.get(
            `
            SELECT COUNT(*) as total
            FROM orders
            WHERE LOWER(status) = 'completed'
            `,
            [],
            (err, row) => {
                stats.completedOrders =
                    row?.total || 0;
            }
        );

        db.get(
            `
            SELECT COUNT(*) as total
            FROM products
            WHERE stock_quantity <= low_stock_threshold
            `,
            [],
            (err, row) => {
                stats.lowStockProducts =
                    row?.total || 0;
            }
        );

        db.get(
            `
            SELECT COUNT(*) AS total
            FROM reviews
            WHERE LOWER(status) = 'pending'
            `,
            [],
            (err, row) => {
                stats.pendingReviews = row?.total || 0;
            }
        );

        db.get(
            `
            SELECT COUNT(*) AS total
            FROM nutrition_requests
            WHERE LOWER(status) = 'pending'
            `,
            [],
            (err, row) => {
                stats.pendingNutrition = row?.total || 0;
            }
        );

        db.get(
            `
            SELECT COUNT(*) AS total
            FROM contact_messages
            WHERE read = 0
            `,
            [],
            (err, row) => {
                stats.unreadMessages = row?.total || 0;
            }
        );

        db.get(
            `
            SELECT SUM(total) as revenue
            FROM orders
            `,
            [],
            (err, row) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                stats.totalRevenue = row?.revenue || 0;

                res.json(stats);
            }
        );

    });
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