const User = require('../models/User');
const authConfig = require('../config/auth');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { successResponse } = require('../utils/helpers');
const { formatTunisianPhone } = require('../utils/validators');
const { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res, next) => {
  const { email, password, phone, fullName } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError(
      ERROR_MESSAGES.USER_EXISTS,
      409,
      ERROR_CODES.USER_ALREADY_EXISTS
    );
  }

  // Format phone number
  const formattedPhone = formatTunisianPhone(phone);

  // Create new user
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    phone: formattedPhone,
    fullName,
  });

  // Generate tokens
  const { accessToken, refreshToken } = authConfig.generateTokens(user.id);

  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  // Log registration
  logger.info('New user registered', { userId: user.id, email: user.email });

  // Send response
  res.status(201).json(successResponse({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  }, SUCCESS_MESSAGES.ACCOUNT_CREATED));
});

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and verify password
  const user = await User.findByCredentials(email, password);

  // Generate tokens
  const { accessToken, refreshToken } = authConfig.generateTokens(user.id);

  // Update user
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  // Log login
  logger.info('User logged in', { userId: user.id, email: user.email });

  // Send response
  res.json(successResponse({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      preferences: user.preferences,
      language: user.language,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  }, SUCCESS_MESSAGES.LOGIN_SUCCESS));
});

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  let decoded;
  try {
    decoded = authConfig.verifyToken(refreshToken);
  } catch (error) {
    throw new AppError(
      ERROR_MESSAGES.UNAUTHORIZED,
      401,
      ERROR_CODES.AUTH_TOKEN_INVALID
    );
  }

  // Find user with this refresh token
  const user = await User.findOne({ 
    where: { id: decoded.userId, refreshToken: refreshToken } 
  });
  
  if (!user) {
    throw new AppError(
      ERROR_MESSAGES.UNAUTHORIZED,
      401,
      ERROR_CODES.AUTH_TOKEN_INVALID
    );
  }

  // Generate new tokens
  const tokens = authConfig.generateTokens(user.id);

  // Update refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  // Send response
  res.json(successResponse({
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  }));
});

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token
  const user = await User.findByPk(req.userId);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  // Log logout
  logger.info('User logged out', { userId: req.userId });

  // Send response
  res.json(successResponse(null, {
    fr: 'Déconnexion réussie',
    ar: 'تم تسجيل الخروج بنجاح',
  }));
});

/**
 * Get current user
 * @route GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res, next) => {
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
  }).select('title price surface location_id.city images type').lean();

  res.json(successResponse({
    user: {
      ...user.toJSON(),
      favoriteProperties
    },
  }));
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};