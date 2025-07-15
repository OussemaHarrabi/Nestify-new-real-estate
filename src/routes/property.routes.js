const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { optionalAuth } = require('../middleware/auth.middleware');
const {
  validatePropertySearch,
  validatePropertyId,
} = require('../middleware/validation.middleware');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: Get all properties with filters
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: surfaceMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: surfaceMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: rooms
 *         schema:
 *           type: number
 *       - in: query
 *         name: features
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: isVefa
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, surface_asc, surface_desc, views]
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
router.get(
  '/',
  optionalAuth,
  validatePropertySearch,
  propertyController.getProperties
);

/**
 * @swagger
 * /api/v1/properties/search:
 *   get:
 *     summary: Search properties with text query
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 */
router.get(
  '/search',
  optionalAuth,
  validatePropertySearch,
  propertyController.searchProperties
);

/**
 * @swagger
 * /api/v1/properties/featured:
 *   get:
 *     summary: Get featured properties
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 */
router.get(
  '/featured',
  optionalAuth,
  propertyController.getFeaturedProperties
);

/**
 * @swagger
 * /api/v1/properties/stats:
 *   get:
 *     summary: Get property statistics
 *     tags: [Properties]
 */
router.get(
  '/stats',
  propertyController.getPropertyStats
);

/**
 * @swagger
 * /api/v1/properties/cities/{city}:
 *   get:
 *     summary: Get properties by city
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/cities/:city',
  optionalAuth,
  propertyController.getPropertiesByCity
);

/**
 * @swagger
 * /api/v1/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/:id',
  optionalAuth,
  validatePropertyId,
  propertyController.getProperty
);

/**
 * @swagger
 * /api/v1/properties/{id}/related:
 *   get:
 *     summary: Get related properties
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 */
router.get(
  '/:id/related',
  optionalAuth,
  validatePropertyId,
  propertyController.getRelatedProperties
);

/**
 * @swagger
 * /api/v1/properties/{id}/view:
 *   post:
 *     summary: Increment property views
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  '/:id/view',
  rateLimiter.propertyView,
  validatePropertyId,
  propertyController.incrementViews
);

module.exports = router;