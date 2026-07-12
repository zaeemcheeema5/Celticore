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
 */
router.get('/active', getActiveProducts);

// ==========================
// Everything below mutates the catalog or exposes internal stock
// data — admin only. These previously had NO auth check at all,
// meaning anyone could create/edit/delete products or read low-stock
// inventory levels without logging in.
// ==========================

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get low stock products (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 */
router.get('/low-stock', adminAuthMiddleware, getLowStockProducts);

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
 *         description: Product created
 */
router.post("/", adminAuthMiddleware, addProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', adminAuthMiddleware, updateProduct);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Update product stock (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id/stock', adminAuthMiddleware, updateStock);

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
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete("/:id", adminAuthMiddleware, deleteProduct);

module.exports = router;
