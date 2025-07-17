const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validatePropertyId } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/favorites:
 *   get:
 *     summary: Get user's favorite properties
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
router.get('/', favoriteController.getFavorites);

/**
 * @swagger
 * /api/v1/favorites/stats:
 *   get:
 *     summary: Get favorite statistics
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', favoriteController.getFavoriteStats);

/**
 * @swagger
 * /api/v1/favorites/export:
 *   get:
 *     summary: Export favorites as JSON
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 */
router.get('/export', favoriteController.exportFavorites);

/**
 * @swagger
 * /api/v1/favorites/check:
 *   post:
 *     summary: Check if properties are favorited
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyIds
 *             properties:
 *               propertyIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/check', favoriteController.checkFavorites);

/**
 * @swagger
 * /api/v1/favorites/{propertyId}:
 *   post:
 *     summary: Add property to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  '/:propertyId',
  validatePropertyId,
  favoriteController.addFavorite
);

/**
 * @swagger
 * /api/v1/favorites/{propertyId}:
 *   delete:
 *     summary: Remove property from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  '/:propertyId',
  validatePropertyId,
  favoriteController.removeFavorite
);

module.exports = router;