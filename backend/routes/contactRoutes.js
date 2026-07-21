const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const validateContact = require('../middleware/validateContact');
const { requestLimiter } = require('../middleware/rateLimit');

const {
    sendMessage,
    getMessages,
    markRead,
    deleteMessage
} = require('../controllers/contactController');

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact Form Management APIs
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Send a contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               subject:
 *                 type: string
 *                 example: Product Inquiry
 *               message:
 *                 type: string
 *                 example: I would like to know more about Whey Protein.
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input
 */
// requestLimiter: caps repeated submissions from the same client (20 per 15
// min) so the form can't be scripted for spam/storage abuse.
// validateContact: rejects missing/invalid/oversized fields before they ever
// reach the database — see middleware/validateContact.js.
router.post('/', requestLimiter, validateContact, sendMessage);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages
 *     tags: [Contact]
 *     responses:
 *       200:
 *         description: List of contact messages
 */
router.get('/', adminAuthMiddleware, getMessages);

/**
 * @swagger
 * /api/contact/{id}/read:
 *   put:
 *     summary: Mark a contact message as read
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 */
router.put('/:id/read', adminAuthMiddleware, markRead);

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact message
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         description: Message not found
 */
router.delete('/:id', adminAuthMiddleware, deleteMessage);

module.exports = router;