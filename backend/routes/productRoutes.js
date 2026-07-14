const express = require('express');

const router = express.Router();

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
 * /api/products:
 *   post:
 *     summary: Add new product
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Product created
 */
router.post("/", addProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete("/:id", deleteProduct);
router.get('/', getProducts);

router.get('/active', getActiveProducts);

router.get('/low-stock', getLowStockProducts);

router.put('/:id', updateProduct);

router.put('/:id/stock', updateStock);



module.exports = router;