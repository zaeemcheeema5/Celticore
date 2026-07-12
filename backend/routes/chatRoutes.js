const express = require('express');
const router = express.Router();

const {
    startSession,
    sendMessage,
    getChatHistory
} = require('../controllers/chatController');

/**
 * @swagger
 * tags:
 *   name: Chatbot
 */

/**
 * @swagger
 * /api/chat/start:
 *   post:
 *     summary: Start chat session
 *     tags: [Chatbot]
 */
router.post('/start', startSession);

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send chatbot message
 *     tags: [Chatbot]
 */
router.post('/message', sendMessage);

/**
 * @swagger
 * /api/chat/history/{sessionId}:
 *   get:
 *     summary: Get chat history
 *     tags: [Chatbot]
 */
router.get('/history/:sessionId', getChatHistory);

module.exports = router;