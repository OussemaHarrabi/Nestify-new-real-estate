const User = require('../models/User');
const Property = require('../models/Property');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { successResponse, generatePaginationMeta } = require('../utils/helpers');
const { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Get user's favorite properties
 * @route GET /api/v1/favorites
 */
const getFavorites = asyncHandler(async (req, res, next) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    sort = '-createdAt',
  } = req.query;

  // Get user from PostgreSQL
  const user = await User.findByPk(req.userId);
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  const favorites = user.favorites || [];
  
  // Get total count
  const total = favorites.length;

  // Paginate favorite IDs
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedIds = favorites.slice(startIndex, endIndex);

  // Fetch favorite properties from MongoDB
  const properties = await Property.find({
    _id: { $in: paginatedIds },
    validated: true,
  })
    .populate('promoter_id', 'name verified contact.phone')
    .lean();

  // Maintain order and add favorited flag
  const orderedProperties = paginatedIds.map(id => {
    const property = properties.find(p => p._id === id);
    if (property) {
      property.isFavorited = true;
      property.favoritedAt = user.createdAt; // We don't track individual favorite dates yet
    }
    return property;
  }).filter(Boolean);

  res.json(successResponse({
    favorites: orderedProperties,
    pagination: generatePaginationMeta(total, page, limit),
  }));
});

/**
 * Add property to favorites
 * @route POST /api/v1/favorites/:propertyId
 */
const addFavorite = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

  // Check if property exists in MongoDB
  const property = await Property.findById(propertyId);
  
  if (!property || !property.validated) {
    throw new AppError(
      ERROR_MESSAGES.PROPERTY_NOT_FOUND,
      404,
      ERROR_CODES.PROPERTY_NOT_FOUND
    );
  }

  // Get user from PostgreSQL
  const user = await User.findByPk(req.userId);
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Check if already favorited
  if (user.hasFavorited(propertyId)) {
    return res.json(successResponse({
      message: {
        fr: 'Cette propriété est déjà dans vos favoris',
        ar: 'هذا العقار موجود بالفعل في المفضلة',
      },
      isFavorited: true,
    }));
  }

  // Add to favorites
  await user.addFavorite(propertyId);

  // Log action
  logger.info('Property added to favorites', {
    userId: user.id,
    propertyId,
  });

  res.json(successResponse({
    message: SUCCESS_MESSAGES.FAVORITE_ADDED,
    isFavorited: true,
    totalFavorites: user.favorites.length,
  }));
});

/**
 * Remove property from favorites
 * @route DELETE /api/v1/favorites/:propertyId
 */
const removeFavorite = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

  // Get user
  const user = await User.findById(req.userId);
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Check if favorited
  if (!user.hasFavorited(propertyId)) {
    return res.json(successResponse({
      message: {
        fr: 'Cette propriété n\'est pas dans vos favoris',
        ar: 'هذا العقار ليس في المفضلة',
      },
      isFavorited: false,
    }));
  }

  // Remove from favorites
  await user.removeFavorite(propertyId);

  // Log action
  logger.info('Property removed from favorites', {
    userId: user._id,
    propertyId,
  });

  res.json(successResponse({
    message: SUCCESS_MESSAGES.FAVORITE_REMOVED,
    isFavorited: false,
    totalFavorites: user.favorites.length,
  }));
});

/**
 * Check if properties are favorited
 * @route POST /api/v1/favorites/check
 */
const checkFavorites = asyncHandler(async (req, res, next) => {
  const { propertyIds } = req.body;

  if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
    throw new AppError(
      {
        fr: 'Liste des IDs de propriétés requise',
        ar: 'قائمة معرفات العقارات مطلوبة',
      },
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Get user
  const user = await User.findById(req.userId).select('favorites');
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Check each property
  const favoriteStatus = {};
  propertyIds.forEach(id => {
    favoriteStatus[id] = user.favorites.includes(id);
  });

  res.json(successResponse({
    favorites: favoriteStatus,
  }));
});

/**
 * Get favorite statistics
 * @route GET /api/v1/favorites/stats
 */
const getFavoriteStats = asyncHandler(async (req, res, next) => {
  // Get user with populated favorites
  const user = await User.findById(req.userId)
    .populate({
      path: 'favorites',
      select: 'price surface type location_id.city apartment_details_id.rooms',
      match: { validated: true },
    })
    .lean();

  if (!user || !user.favorites || user.favorites.length === 0) {
    return res.json(successResponse({
      stats: {
        total: 0,
        byType: {},
        byCity: {},
        priceRange: { min: 0, max: 0, avg: 0 },
        surfaceRange: { min: 0, max: 0, avg: 0 },
      },
    }));
  }

  // Calculate statistics
  const stats = {
    total: user.favorites.length,
    byType: {},
    byCity: {},
    byRooms: {},
  };

  let prices = [];
  let surfaces = [];

  user.favorites.forEach(property => {
    // Type stats
    if (property.type) {
      stats.byType[property.type] = (stats.byType[property.type] || 0) + 1;
    }

    // City stats
    if (property.location_id?.city) {
      stats.byCity[property.location_id.city] = (stats.byCity[property.location_id.city] || 0) + 1;
    }

    // Rooms stats
    if (property.apartment_details_id?.rooms) {
      const rooms = `${property.apartment_details_id.rooms} pièces`;
      stats.byRooms[rooms] = (stats.byRooms[rooms] || 0) + 1;
    }

    // Collect prices and surfaces
    if (property.price > 0) prices.push(property.price);
    if (property.surface > 0) surfaces.push(property.surface);
  });

  // Calculate price range
  if (prices.length > 0) {
    stats.priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    };
  } else {
    stats.priceRange = { min: 0, max: 0, avg: 0 };
  }

  // Calculate surface range
  if (surfaces.length > 0) {
    stats.surfaceRange = {
      min: Math.min(...surfaces),
      max: Math.max(...surfaces),
      avg: Math.round(surfaces.reduce((a, b) => a + b, 0) / surfaces.length),
    };
  } else {
    stats.surfaceRange = { min: 0, max: 0, avg: 0 };
  }

  res.json(successResponse({
    stats,
  }));
});

/**
 * Export favorites as JSON
 * @route GET /api/v1/favorites/export
 */
const exportFavorites = asyncHandler(async (req, res, next) => {
  // Get user with populated favorites
  const user = await User.findById(req.userId)
    .populate({
      path: 'favorites',
      populate: {
        path: 'promoter_id',
        select: 'name contact',
      },
    })
    .lean();

  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Prepare export data
  const exportData = {
    user: {
      name: user.fullName,
      email: user.email,
      exportDate: new Date().toISOString(),
    },
    favorites: user.favorites.map(property => ({
      id: property._id,
      title: property.title,
      price: property.price,
      surface: property.surface,
      type: property.type,
      location: {
        city: property.location_id?.city,
        district: property.location_id?.district,
        address: property.location_id?.address,
      },
      details: {
        rooms: property.apartment_details_id?.rooms,
        bedrooms: property.apartment_details_id?.bedrooms,
        bathrooms: property.apartment_details_id?.bathrooms,
        features: property.apartment_details_id?.features,
      },
      promoter: {
        name: property.promoter_id?.name,
        phone: property.promoter_id?.contact?.phone,
        email: property.promoter_id?.contact?.email,
      },
      url: property.url,
    })),
  };

  // Set response headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="nestify-favorites-${Date.now()}.json"`);

  res.json(exportData);
});

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorites,
  getFavoriteStats,
  exportFavorites,
};