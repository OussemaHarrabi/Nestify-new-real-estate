const authConfig = require('../config/auth');
const User = require('../models/User');
const { ERROR_CODES, ERROR_MESSAGES } = require('../config/constants');

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from header
    const token = authConfig.extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_NO_TOKEN,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = authConfig.verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_TOKEN_EXPIRED,
            message: ERROR_MESSAGES.TOKEN_EXPIRED,
          },
        });
      }
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
      });
    }

    // Find user
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_UNAUTHORIZED,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.SERVER_ERROR,
        message: ERROR_MESSAGES.SERVER_ERROR,
      },
    });
  }
};

// Optional auth middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = authConfig.extractToken(req.headers.authorization);
    
    if (token) {
      try {
        const decoded = authConfig.verifyToken(token);
        const user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ['password', 'refreshToken'] }
        });
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user.id;
        }
      } catch (error) {
        // Token is invalid but we don't fail the request
        console.error('Optional auth token error:', error.message);
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };