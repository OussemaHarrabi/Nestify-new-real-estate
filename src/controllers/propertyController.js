const Property = require('../models/Property');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { successResponse, generatePaginationMeta, buildSortObject, parseArrayFromQuery } = require('../utils/helpers');
const { ERROR_CODES, ERROR_MESSAGES, PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Get all properties with filters
 * @route GET /api/v1/properties
 */
const getProperties = asyncHandler(async (req, res, next) => {
  const {
    city, type, priceMin, priceMax, surfaceMin, surfaceMax,
    rooms, features, isVefa, deliveryDateBefore, sort,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  // Build query
  const query = await Property.search({
    city,
    type,
    priceMin,
    priceMax,
    surfaceMin,
    surfaceMax,
    rooms,
    features: parseArrayFromQuery(features),
    isVefa,
    deliveryDateBefore,
  });

  // Execute query with pagination
  const total = await Property.countDocuments(query);
  const properties = await Property.find(query)
    .populate('promoter_id', 'name verified contact.phone')
    .sort(buildSortObject(sort))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Add user-specific data if authenticated
  if (req.user) {
    properties.forEach(property => {
      property.isFavorited = req.user.favorites.includes(property._id);
    });
  }

  // Send response
  res.json(successResponse({
    properties,
    pagination: generatePaginationMeta(total, page, limit),
  }));
});

/**
 * Get single property by ID
 * @route GET /api/v1/properties/:id
 */
const getProperty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find property
  const property = await Property.findById(id)
    .populate('promoter_id')
    .lean();

  if (!property) {
    throw new AppError(
      ERROR_MESSAGES.PROPERTY_NOT_FOUND,
      404,
      ERROR_CODES.PROPERTY_NOT_FOUND
    );
  }

  // Add user-specific data
  if (req.user) {
    property.isFavorited = req.user.favorites.includes(property._id);
  }

  // Send response
  res.json(successResponse({
    property,
  }));
});

/**
 * Get related properties
 * @route GET /api/v1/properties/:id/related
 */
const getRelatedProperties = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const limit = Math.min(req.query.limit || 6, 20);

  // Find similar properties
  const relatedProperties = await Property.findSimilar(id, limit);

  // Add user-specific data
  if (req.user) {
    relatedProperties.forEach(property => {
      property.isFavorited = req.user.favorites.includes(property._id);
    });
  }

  // Send response
  res.json(successResponse({
    properties: relatedProperties,
  }));
});

/**
 * Increment property views
 * @route POST /api/v1/properties/:id/view
 */
const incrementViews = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find and update property
  const property = await Property.findById(id);
  
  if (!property) {
    throw new AppError(
      ERROR_MESSAGES.PROPERTY_NOT_FOUND,
      404,
      ERROR_CODES.PROPERTY_NOT_FOUND
    );
  }

  // Increment views
  await property.incrementViews();

  // Log view
  logger.info('Property viewed', {
    propertyId: id,
    userId: req.userId || 'anonymous',
    ip: req.ip,
  });

  // Send response
  res.json(successResponse({
    views: property.views,
  }));
});

/**
 * Search properties (advanced search with text)
 * @route GET /api/v1/properties/search
 */
const searchProperties = asyncHandler(async (req, res, next) => {
  const {
    q, // Search query
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    ...filters
  } = req.query;

  // Build search query
  const query = await Property.search(filters);

  // Add text search if query provided
  if (q) {
    query.$text = { $search: q };
  }

  // Execute search
  const total = await Property.countDocuments(query);
  const properties = await Property.find(query)
    .populate('promoter_id', 'name verified')
    .sort(q ? { score: { $meta: 'textScore' } } : buildSortObject(filters.sort))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Send response
  res.json(successResponse({
    properties,
    pagination: generatePaginationMeta(total, page, limit),
    searchQuery: q,
  }));
});

/**
 * Get featured properties
 * @route GET /api/v1/properties/featured
 */
const getFeaturedProperties = asyncHandler(async (req, res, next) => {
  const limit = Math.min(req.query.limit || 12, 30);

  // Get most viewed properties from verified promoters
  const featuredProperties = await Property.find({
    validated: true,
  })
    .populate({
      path: 'promoter_id',
      match: { verified: true },
    })
    .sort('-views -created_at')
    .limit(limit)
    .lean();

  // Filter out properties without verified promoters
  const filtered = featuredProperties.filter(p => p.promoter_id);

  // Send response
  res.json(successResponse({
    properties: filtered,
  }));
});

/**
 * Get properties by city
 * @route GET /api/v1/properties/cities/:city
 */
const getPropertiesByCity = asyncHandler(async (req, res, next) => {
  const { city } = req.params;
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sort,
  } = req.query;

  // Find properties in city
  const query = { 
    validated: true,
    'location_id.city': new RegExp(city, 'i'),
  };

  const total = await Property.countDocuments(query);
  const properties = await Property.find(query)
    .populate('promoter_id', 'name verified')
    .sort(buildSortObject(sort))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Send response
  res.json(successResponse({
    city,
    properties,
    pagination: generatePaginationMeta(total, page, limit),
  }));
});

/**
 * Get property statistics
 * @route GET /api/v1/properties/stats
 */
const getPropertyStats = asyncHandler(async (req, res, next) => {
  const stats = await Property.aggregate([
    { $match: { validated: true } },
    {
      $group: {
        _id: null,
        totalProperties: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        avgSurface: { $avg: '$surface' },
        totalViews: { $sum: '$views' },
      },
    },
    {
      $lookup: {
        from: 'properties',
        pipeline: [
          { $match: { validated: true } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        as: 'propertyTypes',
      },
    },
    {
      $lookup: {
        from: 'properties',
        pipeline: [
          { $match: { validated: true } },
          { $group: { _id: '$location_id.city', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        as: 'topCities',
      },
    },
  ]);

  // Send response
  res.json(successResponse({
    stats: stats[0] || {
      totalProperties: 0,
      avgPrice: 0,
      avgSurface: 0,
      totalViews: 0,
      propertyTypes: [],
      topCities: [],
    },
  }));
});

module.exports = {
  getProperties,
  getProperty,
  getRelatedProperties,
  incrementViews,
  searchProperties,
  getFeaturedProperties,
  getPropertiesByCity,
  getPropertyStats,
};