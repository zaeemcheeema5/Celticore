const express = require("express");
const router = express.Router();

const {
    uploadProductImage,
    uploadCategoryImage
} = require("../controllers/uploadController");

const {
    uploadProduct,
    uploadCategory
} = require("../middleware/uploadMiddleware");

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Image Upload APIs
 */

/**
 * @swagger
 * /api/upload/product:
 *   post:
 *     summary: Upload Product Image
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product image uploaded successfully
 */
router.post(
    "/product",
    uploadProduct.single("image"),
    uploadProductImage
);

/**
 * @swagger
 * /api/upload/category:
 *   post:
 *     summary: Upload Category Image
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category image uploaded successfully
 */
router.post(
    "/category",
    uploadCategory.single("image"),
    uploadCategoryImage
);

module.exports = router;