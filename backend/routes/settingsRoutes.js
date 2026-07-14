const express = require("express");
const router = express.Router();

const {
    getSettings,
    updateSettings,
    adminLogin,
    createPaymentIntent,
    getAdminProfile,
    getUsers,
    createAdminProfile,
    deleteUser,
    updateAdminCredentials
} = require("../controllers/settingsController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const { authLimiter } = require("../middleware/rateLimit");

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Store Settings & Admin APIs
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get store settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Store settings retrieved successfully
 */
router.get("/", adminAuthMiddleware, getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update store settings
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               store_name:
 *                 type: string
 *                 example: CeltiCore
 *               support_email:
 *                 type: string
 *                 example: support@celticore.com
 *               currency:
 *                 type: string
 *                 enum:
 *                   - GBP
 *                   - USD
 *                   - EUR
 *                   - PKR
 *                 example: GBP
 *               enable_card:
 *                 type: string
 *                 example: "1"
 *               enable_bank:
 *                 type: string
 *                 example: "1"
 *               enable_cod:
 *                 type: string
 *                 example: "1"
 *               enable_easypaisa:
 *                 type: string
 *                 example: "0"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put("/", adminAuthMiddleware, updateSettings);

/**
 * @swagger
 * /api/settings/admin-login:
 *   post:
 *     summary: Admin Login
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post("/admin-login", authLimiter, adminLogin);

/**
 * @swagger
 * /api/settings/admin/profile:
 *   get:
 *     summary: Get Admin Profile
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 */
router.get(
    "/admin/profile",
    adminAuthMiddleware,
    getAdminProfile
);

/**
 * @swagger
 * /api/settings/create-payment-intent:
 *   post:
 *     summary: Create Stripe Payment Intent
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 199.99
 *     responses:
 *       200:
 *         description: Payment Intent created successfully
 */
router.post(
    "/create-payment-intent",
    adminAuthMiddleware,
    createPaymentIntent
);

/**
 * @swagger
 * /api/settings/users:
 *   get:
 *     summary: Get combined accounts directory (master admin + secondary admins + customers)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Accounts fetched successfully
 */
router.get(
    "/users",
    adminAuthMiddleware,
    getUsers
);

/**
 * @swagger
 * /api/settings/admins:
 *   post:
 *     summary: Create a secondary admin profile (master admin only)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin profile created successfully
 *       403:
 *         description: Only the master administrator can create admin profiles
 */
router.post(
    "/admins",
    adminAuthMiddleware,
    createAdminProfile
);

/**
 * @swagger
 * /api/settings/users/{id}:
 *   delete:
 *     summary: Delete an admin or customer account by prefixed id (main-admin / admin-<id> / customer-<id>)
 *     tags: [Settings]
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
 *         description: Account deleted successfully
 *       403:
 *         description: Not permitted to delete this account
 */
router.delete(
    "/users/:id",
    adminAuthMiddleware,
    deleteUser
);

/**
 * @swagger
 * /api/settings/admin/credentials:
 *   put:
 *     summary: Update the logged-in admin's own credentials (master admin updates the master credentials; a secondary admin updates their own profile)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credentials updated successfully
 */
router.put(
    "/admin/credentials",
    adminAuthMiddleware,
    updateAdminCredentials
);

module.exports = router;