const express = require('express');

const router = express.Router();

const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const {
    getDashboardStats,
    getSalesReport,
    getTopProducts,
    getLowStockProducts,
    getRecentOrders
} = require('../controllers/dashboardController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 */

// All dashboard endpoints expose business/sales data — admin only.
// These previously had no auth check at all.

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 */
router.get("/", adminAuthMiddleware, getDashboardStats);

// Sales Analytics
router.get('/sales', adminAuthMiddleware, getSalesReport);

// Top Selling Products
router.get('/top-products', adminAuthMiddleware, getTopProducts);

// Low Stock Products
router.get('/low-stock', adminAuthMiddleware, getLowStockProducts);

module.exports = router;
