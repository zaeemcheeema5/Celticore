const express = require('express');

const router = express.Router();

const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');


/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management APIs
 */


/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 */
router.get(
    '/',
    getCategories
);


/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               image:
 *                 type: string
 *               card_image:
 *                 type: string
 *               tagline:
 *                 type: string
 *               description:
 *                 type: string
 *               accent_color:
 *                 type: string
 *               effect:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category created successfully
 */
router.post(
    '/',
    adminAuthMiddleware,
    addCategory
);


/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               image:
 *                 type: string
 *               card_image:
 *                 type: string
 *               tagline:
 *                 type: string
 *               description:
 *                 type: string
 *               accent_color:
 *                 type: string
 *               effect:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put(
    '/:id',
    adminAuthMiddleware,
    updateCategory
);


/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete(
    '/:id',
    adminAuthMiddleware,
    deleteCategory
);


module.exports = router;