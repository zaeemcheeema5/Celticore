const express = require("express");
const router = express.Router();
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const {
    uploadProductImage,
    uploadCategoryImage,
    uploadReviewImages
} = require("../controllers/uploadController");

const {
    uploadProduct,
    uploadCategory,
    uploadReview
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
    adminAuthMiddleware,
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
    adminAuthMiddleware,
    uploadCategory.single("image"),
    uploadCategoryImage
);

/**
 * @swagger
 * /api/upload/review:
 *   post:
 *     summary: Upload up to 5 review images (logged-in customers only)
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Review images uploaded successfully
 */
router.post(
    "/review",
    authMiddleware,
    uploadReview.array("images", 5),
    uploadReviewImages
);

module.exports = router;