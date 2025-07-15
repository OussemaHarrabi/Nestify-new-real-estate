const rateLimit = require('express-rate-limit');
const { ERROR_CODES, ERROR_MESSAGES } = require('../config/constants');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: ERROR_MESSAGES.RATE_LIMIT,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: ERROR_MESSAGES.RATE_LIMIT,
    },
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Create account limiter
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per hour per IP
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: {
        fr: 'Trop de comptes créés. Veuillez réessayer dans une heure.',
        ar: 'تم إنشاء عدد كبير جدًا من الحسابات. يرجى المحاولة مرة أخرى خلال ساعة.',
      },
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Property view limiter
const propertyViewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 views per minute
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.userId || req.ip;
  },
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: ERROR_MESSAGES.RATE_LIMIT,
    },
  },
});

module.exports = {
  default: generalLimiter,
  auth: authLimiter,
  createAccount: createAccountLimiter,
  propertyView: propertyViewLimiter,
};