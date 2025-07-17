// src/routes/properties.js
const express = require('express');
const Property = require('../models/Property');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateProperty, validatePropertyUpdate } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: Get all properties with filtering and pagination
 *     tags: [Properties]
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: minSurface
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxSurface
 *         schema:
 *           type: number
 *       - in: query
 *         name: isVefa
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, surface, created_at, views]
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      city,
      minPrice,
      maxPrice,
      minSurface,
      maxSurface,
      isVefa,
      lat,
      lng,
      radius = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { validated: true };

    if (type) filter.type = new RegExp(type, 'i');
    if (city) filter['location_id.city'] = new RegExp(city, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minSurface || maxSurface) {
      filter.surface = {};
      if (minSurface) filter.surface.$gte = Number(minSurface);
      if (maxSurface) filter.surface.$lte = Number(maxSurface);
    }
    if (isVefa !== undefined) {
      filter['VEFA_details_id.is_vefa'] = isVefa === 'true';
    }

    // Geolocation filter
    if (lat && lng) {
      const radiusInRadians = Number(radius) / 6371; // Convert km to radians
      filter['location_id.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
        }
      };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [properties, totalCount] = await Promise.all([
      Property.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Property.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          current_page: Number(page),
          total_pages: totalPages,
          total_count: totalCount,
          per_page: Number(limit),
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        }
      }
    });

  } catch (error) {
    logger.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving properties'
    });
  }
});

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
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Increment views
    await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    res.json({
      success: true,
      data: { property }
    });

  } catch (error) {
    logger.error('Get property error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error retrieving property'
    });
  }
});

/**
 * @swagger
 * /api/v1/properties/{id}/favorite:
 *   post:
 *     summary: Add property to favorites
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property added to favorites
 *       404:
 *         description: Property not found
 */
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const user = await User.findByPk(req.user.userId);
    await user.addToFavorites(req.params.id);

    res.json({
      success: true,
      message: 'Property added to favorites'
    });

  } catch (error) {
    logger.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding property to favorites'
    });
  }
});

/**
 * @swagger
 * /api/v1/properties/{id}/favorite:
 *   delete:
 *     summary: Remove property from favorites
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property removed from favorites
 */
router.delete('/:id/favorite', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    await user.removeFromFavorites(req.params.id);

    res.json({
      success: true,
      message: 'Property removed from favorites'
    });

  } catch (error) {
    logger.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing property from favorites'
    });
  }
});

/**
 * @swagger
 * /api/v1/properties/favorites:
 *   get:
 *     summary: Get user's favorite properties
 *     tags: [Properties]
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
 *     responses:
 *       200:
 *         description: Favorite properties retrieved successfully
 */
router.get('/user/favorites', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findByPk(req.user.userId);
    if (!user.favorites || user.favorites.length === 0) {
      return res.json({
        success: true,
        data: {
          properties: [],
          pagination: {
            current_page: Number(page),
            total_pages: 0,
            total_count: 0,
            per_page: Number(limit)
          }
        }
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const favoriteIds = user.favorites.slice(skip, skip + Number(limit));

    const properties = await Property.find({
      _id: { $in: favoriteIds },
      validated: true
    }).lean();

    const totalPages = Math.ceil(user.favorites.length / Number(limit));

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          current_page: Number(page),
          total_pages: totalPages,
          total_count: user.favorites.length,
          per_page: Number(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving favorite properties'
    });
  }
});

/**
 * @swagger
 * /api/v1/properties/similar/{id}:
 *   get:
 *     summary: Get similar properties
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
 *           default: 5
 *     responses:
 *       200:
 *         description: Similar properties retrieved successfully
 */
router.get('/similar/:id', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Find similar properties based on type, location, and price range
    const priceRange = property.price * 0.3; // ±30% price range
    
    const similarProperties = await Property.find({
      _id: { $ne: req.params.id },
      validated: true,
      type: property.type,
      price: {
        $gte: property.price - priceRange,
        $lte: property.price + priceRange
      },
      'location_id.city': property.location_id.city
    })
    .limit(Number(limit))
    .lean();

    res.json({
      success: true,
      data: { properties: similarProperties }
    });

  } catch (error) {
    logger.error('Get similar properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving similar properties'
    });
  }
});

module.exports = router;