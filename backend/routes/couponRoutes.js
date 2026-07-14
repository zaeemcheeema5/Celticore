const express = require('express');

const router = express.Router();

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
 * /api/coupons:
 *   get:
 *     summary: Get coupons
 *     tags: [Coupons]
 */
router.get("/", getCoupons);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create coupon
 *     tags: [Coupons]
 */
router.post("/", createCoupon);

/**
 * @swagger
 * /api/coupons/apply:
 *   post:
 *     summary: Apply coupon
 *     tags: [Coupons]
 */
router.post("/apply", applyCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Coupons]
 */
router.delete("/:id", deleteCoupon);


router.post('/', createCoupon);





module.exports = router;