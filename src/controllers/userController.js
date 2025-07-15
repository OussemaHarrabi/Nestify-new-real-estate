const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { successResponse } = require('../utils/helpers');
const { formatTunisianPhone } = require('../utils/validators');
const { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Get user profile
 * @route GET /api/v1/users/profile
 */
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.userId);

  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Get favorite properties from MongoDB
  const Property = require('../models/Property');
  const favoriteProperties = await Property.find({
    _id: { $in: user.favorites || [] }
  })
    .select('title price surface location_id.city images type')
    .limit(10)
    .lean();

  res.json(successResponse({
    user: {
      ...user.toJSON(),
      favoriteProperties
    },
  }));
});

/**
 * Update user profile
 * @route PUT /api/v1/users/profile
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName, phone, language } = req.body;

  // Find user
  const user = await User.findByPk(req.userId);
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Update fields
  if (fullName) user.fullName = fullName;
  if (phone) user.phone = formatTunisianPhone(phone);
  if (language) user.language = language;

  // Save user
  await user.save();

  // Log update
  logger.info('User profile updated', { userId: user.id });

  res.json(successResponse({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      language: user.language,
    },
  }, SUCCESS_MESSAGES.PROFILE_UPDATED));
});

/**
 * Update user preferences
 * @route PUT /api/v1/users/preferences
 */
const updatePreferences = asyncHandler(async (req, res, next) => {
  const {
    cities, propertyTypes, budgetMin, budgetMax,
    surfaceMin, surfaceMax,
  } = req.body;

  // Find user
  const user = await User.findByPk(req.userId);
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Update preferences (merge with existing)
  const currentPreferences = user.preferences || {};
  user.preferences = {
    ...currentPreferences,
    ...(cities && { cities }),
    ...(propertyTypes && { propertyTypes }),
    ...(budgetMin !== undefined && { budgetMin }),
    ...(budgetMax !== undefined && { budgetMax }),
    ...(surfaceMin !== undefined && { surfaceMin }),
    ...(surfaceMax !== undefined && { surfaceMax }),
  };

  // Save user
  await user.save();

  // Log update
  logger.info('User preferences updated', { userId: user.id });

  res.json(successResponse({
    preferences: user.preferences,
  }, {
    fr: 'Préférences mises à jour avec succès',
    ar: 'تم تحديث التفضيلات بنجاح',
  }));
});

/**
 * Get user statistics
 * @route GET /api/v1/users/stats
 */
const getUserStats = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId)
    .populate('favorites', 'price surface type location_id.city')
    .lean();

  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Calculate statistics
  const stats = {
    totalFavorites: user.favorites.length,
    accountAge: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)), // Days
    lastLogin: user.lastLogin,
  };

  // Favorite properties statistics
  if (user.favorites.length > 0) {
    const prices = user.favorites.map(f => f.price).filter(p => p > 0);
    const surfaces = user.favorites.map(f => f.surface).filter(s => s > 0);
    
    stats.favorites = {
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      avgSurface: surfaces.length > 0 ? Math.round(surfaces.reduce((a, b) => a + b, 0) / surfaces.length) : 0,
      cities: [...new Set(user.favorites.map(f => f.location_id?.city).filter(Boolean))],
      types: [...new Set(user.favorites.map(f => f.type).filter(Boolean))],
    };
  }

  res.json(successResponse({
    stats,
  }));
});

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
const deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError(
      {
        fr: 'Mot de passe requis pour supprimer le compte',
        ar: 'كلمة المرور مطلوبة لحذف الحساب',
      },
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Find user with password
  const user = await User.findById(req.userId).select('+password');
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new AppError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      401,
      ERROR_CODES.AUTH_INVALID_CREDENTIALS
    );
  }

  // Soft delete - mark as inactive
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  user.refreshToken = undefined;
  await user.save();

  // Log deletion
  logger.info('User account deleted', { userId: user._id });

  res.json(successResponse(null, {
    fr: 'Compte supprimé avec succès',
    ar: 'تم حذف الحساب بنجاح',
  }));
});

/**
 * Change password
 * @route PUT /api/v1/users/password
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError(
      {
        fr: 'Les mots de passe actuels et nouveaux sont requis',
        ar: 'كلمة المرور الحالية والجديدة مطلوبة',
      },
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Find user with password
  const user = await User.findById(req.userId).select('+password');
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.USER_NOT_FOUND,
      404,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isPasswordValid) {
    throw new AppError(
      {
        fr: 'Mot de passe actuel incorrect',
        ar: 'كلمة المرور الحالية غير صحيحة',
      },
      401,
      ERROR_CODES.AUTH_INVALID_CREDENTIALS
    );
  }

  // Update password
  user.password = newPassword;
  user.refreshToken = undefined; // Invalidate refresh token
  await user.save();

  // Log password change
  logger.info('User password changed', { userId: user._id });

  res.json(successResponse(null, {
    fr: 'Mot de passe modifié avec succès',
    ar: 'تم تغيير كلمة المرور بنجاح',
  }));
});

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  getUserStats,
  deleteAccount,
  changePassword,
};