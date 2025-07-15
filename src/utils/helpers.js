/**
 * Generate pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
const generatePaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Build sort object for MongoDB
 * @param {string} sortParam - Sort parameter
 * @returns {object} - MongoDB sort object
 */
const buildSortObject = (sortParam) => {
  const sortOptions = {
    newest: { created_at: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    surface_asc: { surface: 1 },
    surface_desc: { surface: -1 },
    views: { views: -1 },
  };
  
  return sortOptions[sortParam] || sortOptions.newest;
};

/**
 * Generate unique reference
 * @param {string} prefix - Reference prefix
 * @returns {string} - Unique reference
 */
const generateReference = (prefix = 'NEST') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`.toUpperCase();
};

/**
 * Clean object - remove undefined and null values
 * @param {object} obj - Object to clean
 * @returns {object} - Cleaned object
 */
const cleanObject = (obj) => {
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

/**
 * Parse array from query string
 * @param {string|array} value - Query value
 * @returns {array} - Parsed array
 */
const parseArrayFromQuery = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Get client IP address
 * @param {object} req - Express request object
 * @returns {string} - IP address
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip;
};

/**
 * Generate success response
 * @param {object} data - Response data
 * @param {object} message - Success message
 * @returns {object} - Success response
 */
const successResponse = (data, message = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  if (message) {
    response.message = message;
  }
  
  return response;
};

/**
 * Generate error response
 * @param {string} code - Error code
 * @param {object} message - Error message
 * @param {object} details - Error details
 * @returns {object} - Error response
 */
const errorResponse = (code, message, details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return response;
};

/**
 * Sleep function for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 * @param {function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} - Result of function
 */
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

/**
 * Chunk array into smaller arrays
 * @param {array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {array} - Array of chunks
 */
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Get date range for filtering
 * @param {string} period - Period (today, week, month)
 * @returns {object} - Date range
 */
const getDateRange = (period) => {
  const now = new Date();
  const ranges = {
    today: {
      start: new Date(now.setHours(0, 0, 0, 0)),
      end: new Date(now.setHours(23, 59, 59, 999)),
    },
    week: {
      start: new Date(now.setDate(now.getDate() - 7)),
      end: new Date(),
    },
    month: {
      start: new Date(now.setMonth(now.getMonth() - 1)),
      end: new Date(),
    },
  };
  
  return ranges[period] || null;
};

module.exports = {
  generatePaginationMeta,
  buildSortObject,
  generateReference,
  cleanObject,
  parseArrayFromQuery,
  getClientIp,
  successResponse,
  errorResponse,
  sleep,
  retryWithBackoff,
  chunkArray,
  getDateRange,
};