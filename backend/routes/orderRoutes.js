const express = require('express');

const router = express.Router();

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
router.get('/', getOrders);

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
router.put('/:id', updateOrderStatus);
router.put('/:id/status', updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order
 *     tags: [Orders]
 */
router.delete('/:id', deleteOrder);

module.exports = router;