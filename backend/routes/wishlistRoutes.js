const express = require('express');
const router = express.Router();

const {
    addToWishlist,
    getWishlist,
    removeWishlistItem,
    clearWishlist
} = require('../controllers/wishlistController');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist Management APIs
 */

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add a product to the wishlist
 *     tags: [Wishlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - product_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               product_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Product added to wishlist successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', addToWishlist);

/**
 * @swagger
 * /api/wishlist/{userId}:
 *   get:
 *     summary: Get wishlist for a specific user
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:userId', getWishlist);

/**
 * @swagger
 * /api/wishlist/item/{id}:
 *   delete:
 *     summary: Remove an item from the wishlist
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Wishlist item removed successfully
 *       404:
 *         description: Wishlist item not found
 */
router.delete('/item/:id', removeWishlistItem);

/**
 * @swagger
 * /api/wishlist/clear/{userId}:
 *   delete:
 *     summary: Clear the entire wishlist of a user
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 *       404:
 *         description: User not found
 */
router.delete('/clear/:userId', clearWishlist);

module.exports = router;