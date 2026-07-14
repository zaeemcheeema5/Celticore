const express = require('express');

const router = express.Router();

const nutritionController =
    require('../controllers/nutritionController');

console.log('Nutrition Controller Loaded');
console.log(nutritionController);
/**
 * @swagger
 * tags:
 *   name: Nutrition
 */

/**
 * @swagger
 * /api/nutrition:
 *   post:
 *     summary: Submit nutrition request
 *     tags: [Nutrition]
 */


/**
 * @swagger
 * /api/nutrition:
 *   get:
 *     summary: Get all nutrition requests
 *     tags: [Nutrition]
 */


/**
 * @swagger
 * /api/nutrition/{id}:
 *   get:
 *     summary: Get nutrition request
 *     tags: [Nutrition]
 */

/**
 * @swagger
 * /api/nutrition/{id}/status:
 *   put:
 *     summary: Update request status
 *     tags: [Nutrition]
 */


/**
 * @swagger
 * /api/nutrition/{id}/notes:
 *   put:
 *     summary: Add admin notes
 *     tags: [Nutrition]
 */

router.post(
    '/',
    nutritionController.createNutritionRequest
);

router.get(
    '/',
    nutritionController.getNutritionRequests
);

router.get(
    '/:id',
    nutritionController.getNutritionRequest
);

router.put(
    '/:id/status',
    nutritionController.updateNutritionStatus
);

router.put(
    '/:id/notes',
    nutritionController.addAdminNotes
);

module.exports = router;