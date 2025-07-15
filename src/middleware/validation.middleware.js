const Joi = require('joi');
const { ERROR_CODES, ERROR_MESSAGES, VALIDATION } = require('../config/constants');

// Custom Joi validators
const tunisianPhone = Joi.string().pattern(VALIDATION.PHONE_REGEX).messages({
  'string.pattern.base': 'Le numéro de téléphone doit être un numéro tunisien valide',
});

const password = Joi.string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': `Le mot de passe doit contenir au moins ${VALIDATION.MIN_PASSWORD_LENGTH} caractères`,
    'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  });

// Validation schemas
const validationSchemas = {
  // Auth validation
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'L\'email est obligatoire',
    }),
    password: password.required(),
    phone: tunisianPhone.required(),
    fullName: Joi.string().min(3).max(50).required().messages({
      'string.min': 'Le nom doit contenir au moins 3 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères',
      'any.required': 'Le nom complet est obligatoire',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // User validation
  updateProfile: Joi.object({
    fullName: Joi.string().min(3).max(50),
    phone: tunisianPhone,
    language: Joi.string().valid('fr', 'ar'),
  }).min(1),

  updatePreferences: Joi.object({
    cities: Joi.array().items(Joi.string()),
    propertyTypes: Joi.array().items(Joi.string()),
    budgetMin: Joi.number().min(0),
    budgetMax: Joi.number().min(0),
    surfaceMin: Joi.number().min(0),
    surfaceMax: Joi.number().min(0),
  }).custom((value, helpers) => {
    if (value.budgetMin && value.budgetMax && value.budgetMin > value.budgetMax) {
      return helpers.error('Le budget minimum ne peut pas être supérieur au budget maximum');
    }
    if (value.surfaceMin && value.surfaceMax && value.surfaceMin > value.surfaceMax) {
      return helpers.error('La surface minimum ne peut pas être supérieure à la surface maximum');
    }
    return value;
  }),

  // Property validation
  propertySearch: Joi.object({
    city: Joi.string(),
    type: Joi.string(),
    priceMin: Joi.number().min(0),
    priceMax: Joi.number().min(0),
    surfaceMin: Joi.number().min(0),
    surfaceMax: Joi.number().min(0),
    rooms: Joi.number().integer().min(1),
    features: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ),
    isVefa: Joi.boolean(),
    deliveryDateBefore: Joi.string(),
    sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'surface_asc', 'surface_desc', 'views'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // ID validation
  mongoId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
      'string.pattern.base': 'ID invalide',
    }),
  }),

  propertyId: Joi.object({
    id: Joi.string().required(),
  }),
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const validationSource = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    const { error, value } = schema.validate(
      schema._ids ? req.params : (req.method === 'GET' ? req.query : req.body),
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          details: errors,
        },
      });
    }

    // Replace request data with validated data
    if (schema._ids) {
      req.params = value;
    } else if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Export validation middleware
module.exports = {
  // Auth validations
  validateRegister: validate(validationSchemas.register),
  validateLogin: validate(validationSchemas.login),
  validateRefreshToken: validate(validationSchemas.refreshToken),
  
  // User validations
  validateUpdateProfile: validate(validationSchemas.updateProfile),
  validateUpdatePreferences: validate(validationSchemas.updatePreferences),
  
  // Property validations
  validatePropertySearch: validate(validationSchemas.propertySearch),
  validatePropertyId: validate(validationSchemas.propertyId),
  
  // ID validations
  validateMongoId: validate(validationSchemas.mongoId),
};