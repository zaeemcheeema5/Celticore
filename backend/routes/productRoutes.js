const express = require('express');

const router = express.Router();

const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const {
    getProducts,
    getProduct,
    addProduct,
    updateProduct,
    updateStock,
    getLowStockProducts,
    getActiveProducts,
    deleteProduct
} = require('../controllers/productController');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product Management
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Product list
 */
router.get("/", getProducts);

/**
 * @swagger
 * /api/products/active:
 *   get:
 *     summary: Get active products only
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Active product list
 */
router.get("/active", getActiveProducts);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get low stock products (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock product list
 */
router.get(
    "/low-stock",
    adminAuthMiddleware,
    getLowStockProducts
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProduct);

// ======================================
// ADMIN ROUTES
// ======================================

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add new product (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Product created successfully
 */
router.post(
    "/",
    adminAuthMiddleware,
    addProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put(
    "/:id",
    adminAuthMiddleware,
    updateProduct
);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Update product stock (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */
router.put(
    "/:id/stock",
    adminAuthMiddleware,
    updateStock
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete(
    "/:id",
    adminAuthMiddleware,
    deleteProduct
);

module.exports = router;