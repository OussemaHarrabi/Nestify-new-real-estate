const { VALIDATION } = require('../config/constants');

/**
 * Validate Tunisian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidTunisianPhone = (phone) => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

/**
 * Format Tunisian phone number
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatTunisianPhone = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +216 if not present
  if (cleaned.length === 8) {
    return `+216${cleaned}`;
  }
  if (cleaned.startsWith('216') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  return phone;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {object} - Strength details
 */
const checkPasswordStrength = (password) => {
  const result = {
    isValid: false,
    strength: 'weak',
    missing: [],
  };

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    result.missing.push(`Au moins ${VALIDATION.MIN_PASSWORD_LENGTH} caractères`);
  }
  if (!/[a-z]/.test(password)) {
    result.missing.push('Une lettre minuscule');
  }
  if (!/[A-Z]/.test(password)) {
    result.missing.push('Une lettre majuscule');
  }
  if (!/\d/.test(password)) {
    result.missing.push('Un chiffre');
  }
  if (!/[@$!%*?&]/.test(password)) {
    result.missing.push('Un caractère spécial (@$!%*?&)');
  }

  if (result.missing.length === 0) {
    result.isValid = true;
    if (password.length >= 12) {
      result.strength = 'strong';
    } else {
      result.strength = 'medium';
    }
  }

  return result;
};

/**
 * Parse French date (e.g., "avril 2025")
 * @param {string} dateStr - French date string
 * @returns {Date|null} - Parsed date or null
 */
const parseFrenchDate = (dateStr) => {
  if (!dateStr) return null;
  
  const months = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };
  
  const parts = dateStr.toLowerCase().split(' ');
  if (parts.length === 2) {
    const [month, year] = parts;
    if (months[month] !== undefined && /^\d{4}$/.test(year)) {
      return new Date(parseInt(year), months[month]);
    }
  }
  
  return null;
};

/**
 * Format price for display
 * @param {number} price - Price in TND
 * @returns {string} - Formatted price
 */
const formatPrice = (price) => {
  if (price === 0) {
    return 'Prix sur demande';
  }
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Format surface area
 * @param {number} surface - Surface in m²
 * @returns {string} - Formatted surface
 */
const formatSurface = (surface) => {
  return `${surface} m²`;
};

/**
 * Sanitize search input
 * @param {string} input - Search input
 * @returns {string} - Sanitized input
 */
const sanitizeSearchInput = (input) => {
  if (!input) return '';
  // Remove special regex characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Calculate distance between two coordinates
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = {
  isValidTunisianPhone,
  formatTunisianPhone,
  isValidEmail,
  checkPasswordStrength,
  parseFrenchDate,
  formatPrice,
  formatSurface,
  sanitizeSearchInput,
  //validateFeatures,
  calculateDistance,
};