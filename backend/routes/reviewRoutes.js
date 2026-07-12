const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const {
    addReview,
    getProductReviews,
    getAllReviews,
    approveReview,
    rejectReview,
    deleteReview
} = require('../controllers/reviewController');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product Review Management APIs
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Add a new product review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - user_name
 *               - rating
 *               - review
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               user_name:
 *                 type: string
 *                 example: John Doe
 *               rating:
 *                 type: integer
 *                 example: 5
 *               review:
 *                 type: string
 *                 example: Excellent protein powder. Highly recommended!
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', addReview);

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get reviews of a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of product reviews
 */
router.get('/product/:productId', getProductReviews);

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: List of all reviews
 */
router.get('/', adminAuthMiddleware, getAllReviews);

/**
 * @swagger
 * /api/reviews/{id}/approve:
 *   put:
 *     summary: Approve a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: Review approved successfully
 *       404:
 *         description: Review not found
 */
router.put('/:id/approve', adminAuthMiddleware, approveReview);

/**
 * @swagger
 * /api/reviews/{id}/reject:
 *   put:
 *     summary: Reject a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: Review rejected successfully
 *       404:
 *         description: Review not found
 */
router.put('/:id/reject', adminAuthMiddleware, rejectReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete('/:id', adminAuthMiddleware, deleteReview);

module.exports = router;