const express = require('express');

const router = express.Router();

const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');

const {
    placeOrder,
    getOrders,
    getMyOrders,
    updateOrderStatus,
    deleteOrder
} = require('../controllers/orderController');

/**
 * @swagger
 * tags:
 *   name: Orders
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 */
router.get('/', adminAuthMiddleware, getOrders);

/**
 * @swagger
 * /api/orders/mine:
 *   get:
 *     summary: Get the logged-in customer's own orders (My Orders page)
 *     tags: [Orders]
 */
router.get('/mine', authMiddleware, getMyOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place order
 *     tags: [Orders]
 */
router.post('/', optionalAuthMiddleware, placeOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 */
router.put('/:id', adminAuthMiddleware, updateOrderStatus);
router.put('/:id/status', adminAuthMiddleware, updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 */
router.delete('/:id', adminAuthMiddleware, deleteOrder);

module.exports = router;