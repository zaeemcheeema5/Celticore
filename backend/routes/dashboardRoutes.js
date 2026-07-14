const express = require('express');

const router = express.Router();

const {
    getDashboardStats,
    getSalesReport,
    getTopProducts,
    getLowStockProducts,
    getRecentOrders
} = require('../controllers/dashboardController');


// Dashboard Overview
router.get('/', getDashboardStats);


// Sales Analytics
router.get('/sales', getSalesReport);


// Top Selling Products
router.get('/top-products', getTopProducts);


// Low Stock Products
router.get('/low-stock', getLowStockProducts);


// Recent Orders
/**
 * @swagger
 * tags:
 *   name: Dashboard
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 */
router.get("/", getDashboardStats);

module.exports = router;