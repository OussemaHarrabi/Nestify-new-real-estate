// src/routes/properties.js
const express = require('express');
const router = express.Router();
const { getProperties, getProperty } = require('../controllers/propertyController');

// Debug pour vérifier que la route est bien définie
console.log('🔗 Property routes loaded');

/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: Get all properties with filtering and pagination
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 */
router.get('/', getProperties);

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
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *       404:
 *         description: Property not found
 */
router.get('/:id', getProperty);

module.exports = router;
