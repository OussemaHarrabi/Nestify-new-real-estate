const logger = require('../utils/logger');
const { ERROR_CODES, ERROR_MESSAGES } = require('../config/constants');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || ERROR_CODES.SERVER_ERROR;
  let message = ERROR_MESSAGES.SERVER_ERROR;

  // Handle specific errors
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
    
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
        details: errors,
      },
    });
  }

  if (err.name === 'CastError') {
    // Invalid MongoDB ID
    statusCode = 400;
    errorCode = ERROR_CODES.INVALID_INPUT;
    message = {
      fr: 'Identifiant invalide',
      ar: 'معرف غير صالح',
    };
  }

  if (err.code === 11000) {
    // Duplicate key error
    statusCode = 409;
    errorCode = ERROR_CODES.USER_ALREADY_EXISTS;
    const field = Object.keys(err.keyValue)[0];
    message = {
      fr: `Cette ${field === 'email' ? 'adresse email' : 'valeur'} est déjà utilisée`,
      ar: `هذا ${field === 'email' ? 'البريد الإلكتروني' : 'القيمة'} مستخدم بالفعل`,
    };
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    statusCode = 500;
    errorCode = ERROR_CODES.DATABASE_ERROR;
    message = ERROR_MESSAGES.SERVER_ERROR;
  }

  // Custom application errors
  if (err.isOperational) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = ERROR_CODES.ROUTE_NOT_FOUND;
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
};