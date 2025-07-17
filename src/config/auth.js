const jwt = require('jsonwebtoken');

const authConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Bcrypt Configuration
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },

  // Token generation
  generateTokens: (userId) => {
    const payload = { userId, type: 'user' };
    
    const accessToken = jwt.sign(
      payload,
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.accessExpiresIn }
    );

    const refreshToken = jwt.sign(
      { ...payload, tokenType: 'refresh' },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  },

  // Token verification
  verifyToken: (token) => {
    try {
      return jwt.verify(token, authConfig.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  // Extract token from header
  extractToken: (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  },
};

module.exports = authConfig;