const express = require('express');

const router = express.Router();

const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const {
    placeOrder,
    getOrders,
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
 * /api/orders:
 *   post:
 *     summary: Place order
 *     tags: [Orders]
 */
router.post('/', placeOrder);

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