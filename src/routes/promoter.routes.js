const express = require('express');
const router = express.Router();
const Promoter = require('../models/Promoter');
const Property = require('../models/Property');
const { asyncHandler } = require('../middleware/error.middleware');
const { successResponse, generatePaginationMeta } = require('../utils/helpers');
const { validateMongoId } = require('../middleware/validation.middleware');
const { PAGINATION } = require('../config/constants');

/**
 * @swagger
 * /api/v1/promoters/{id}:
 *   get:
 *     summary: Get promoter details
 *     tags: [Promoters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', validateMongoId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const promoter = await Promoter.findById(id);
  
  if (!promoter) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PROMOTER_NOT_FOUND',
        message: {
          fr: 'Promoteur introuvable',
          ar: 'المطور غير موجود',
        },
      },
    });
  }
  
  res.json(successResponse({ promoter }));
}));

/**
 * @swagger
 * /api/v1/promoters/{id}/properties:
 *   get:
 *     summary: Get properties by promoter
 *     tags: [Promoters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.get('/:id/properties', validateMongoId, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;
  
  // Check if promoter exists
  const promoter = await Promoter.findById(id);
  
  if (!promoter) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PROMOTER_NOT_FOUND',
        message: {
          fr: 'Promoteur introuvable',
          ar: 'المطور غير موجود',
        },
      },
    });
  }
  
  // Get properties
  const query = { promoter_id: id, validated: true };
  const total = await Property.countDocuments(query);
  const properties = await Property.find(query)
    .sort('-created_at')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  res.json(successResponse({
    promoter: {
      id: promoter._id,
      name: promoter.name,
      verified: promoter.verified,
    },
    properties,
    pagination: generatePaginationMeta(total, page, limit),
  }));
}));

/**
 * @swagger
 * /api/v1/promoters:
 *   get:
 *     summary: Get all verified promoters
 *     tags: [Promoters]
 */
router.get('/', asyncHandler(async (req, res) => {
  const promoters = await Promoter.findVerified();
  
  res.json(successResponse({
    promoters,
    total: promoters.length,
  }));
}));

module.exports = router;