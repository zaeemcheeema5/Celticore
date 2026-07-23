const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const {
    addReview,
    updateReview,
    getProductReviews,
    getProductReviewSummary,
    getEligibility,
    markHelpful,
    getAllReviews,
    updateReviewStatus,
    replyToReview,
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
 *     summary: Submit a review for a delivered, purchased product (logged-in customer)
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, orderId, rating, title, review]
 *             properties:
 *               productId: { type: string }
 *               orderId: { type: integer }
 *               rating: { type: integer, example: 5 }
 *               title: { type: string }
 *               review: { type: string }
 *               images:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201: { description: Review submitted (Pending moderation) }
 *       400: { description: Invalid request }
 *       403: { description: Not eligible to review this product/order }
 *       409: { description: Already reviewed this product for this order }
 */
router.post('/', authMiddleware, addReview);

// ── Admin listing (must be declared before the generic /:productId route) ──

/**
 * @swagger
 * /api/reviews/admin/all:
 *   get:
 *     summary: Admin - list all reviews, filterable by product, rating, status
 *     tags: [Reviews]
 */
router.get('/admin/all', adminAuthMiddleware, getAllReviews);

/**
 * @swagger
 * /api/reviews/eligibility/{productId}:
 *   get:
 *     summary: Check which of the logged-in customer's delivered orders for this product can still be reviewed
 *     tags: [Reviews]
 */
router.get('/eligibility/:productId', authMiddleware, getEligibility);

/**
 * @swagger
 * /api/reviews/{productId}/summary:
 *   get:
 *     summary: Average rating, total count, and star breakdown for a product
 *     tags: [Reviews]
 */
router.get('/:productId/summary', getProductReviewSummary);

/**
 * @swagger
 * /api/reviews/{productId}:
 *   get:
 *     summary: Get approved reviews for a product (sortable, filterable, paginated)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, highest, lowest, helpful] }
 *       - in: query
 *         name: rating
 *         schema: { type: integer }
 *       - in: query
 *         name: media
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: offset
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of approved reviews }
 */
router.get('/:productId', getProductReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Edit your own review (resets it to Pending for re-approval)
 *     tags: [Reviews]
 */
router.put('/:reviewId', authMiddleware, updateReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review (admin only)
 *     tags: [Reviews]
 */
router.delete('/:reviewId', adminAuthMiddleware, deleteReview);

/**
 * @swagger
 * /api/reviews/{reviewId}/status:
 *   patch:
 *     summary: Approve or reject a review (admin)
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, approved, rejected] }
 */
router.patch('/:reviewId/status', adminAuthMiddleware, updateReviewStatus);

/**
 * @swagger
 * /api/reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark a review as helpful (logged-in customer, one vote each)
 *     tags: [Reviews]
 */
router.post('/:reviewId/helpful', authMiddleware, markHelpful);

/**
 * @swagger
 * /api/reviews/{reviewId}/reply:
 *   post:
 *     summary: Admin reply to a customer review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reply]
 *             properties:
 *               reply: { type: string }
 */
router.post('/:reviewId/reply', adminAuthMiddleware, replyToReview);

module.exports = router;