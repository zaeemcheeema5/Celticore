const express = require('express');

const router = express.Router();

const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const {
    getCoupons,
    createCoupon,
    deleteCoupon,
    applyCoupon
} = require('../controllers/couponController');

/**
 * @swagger
 * tags:
 *   name: Coupons
 */

/**
 * @swagger
 * /api/coupons/apply:
 *   post:
 *     summary: Apply coupon (public — used at checkout)
 *     tags: [Coupons]
 */
router.post("/apply", applyCoupon);

// ==========================
// Everything below manages the coupon catalog itself — admin only.
// These had NO auth check at all, meaning anyone could create a
// 100%-off coupon or delete existing ones without logging in.
// ==========================

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Get coupons (admin only)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 */
router.get("/", adminAuthMiddleware, getCoupons);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create coupon (admin only)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 */
router.post("/", adminAuthMiddleware, createCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete coupon (admin only)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 */
router.delete("/:id", adminAuthMiddleware, deleteCoupon);

module.exports = router;
