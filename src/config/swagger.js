const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nestify API',
      version: '1.0.0',
      description: 'API backend pour Nestify - Plateforme immobilière premium en Tunisie',
      contact: {
        name: 'Nestify Support',
        email: 'support@nestify.tn',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.nestify.tn',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                message: {
                  type: 'object',
                  properties: {
                    fr: {
                      type: 'string',
                    },
                    ar: {
                      type: 'string',
                    },
                  },
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'object',
              properties: {
                fr: {
                  type: 'string',
                },
                ar: {
                  type: 'string',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
            },
            totalPages: {
              type: 'integer',
            },
            totalItems: {
              type: 'integer',
            },
            itemsPerPage: {
              type: 'integer',
            },
            hasNext: {
              type: 'boolean',
            },
            hasPrev: {
              type: 'boolean',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            fullName: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            preferences: {
              type: 'object',
              properties: {
                cities: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                propertyTypes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                budgetMin: {
                  type: 'number',
                },
                budgetMax: {
                  type: 'number',
                },
                surfaceMin: {
                  type: 'number',
                },
                surfaceMax: {
                  type: 'number',
                },
              },
            },
            language: {
              type: 'string',
              enum: ['fr', 'ar'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Property: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            price: {
              type: 'number',
            },
            surface: {
              type: 'number',
            },
            type: {
              type: 'string',
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            location_id: {
              type: 'object',
              properties: {
                city: {
                  type: 'string',
                },
                district: {
                  type: 'string',
                },
                address: {
                  type: 'string',
                },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: {
                      type: 'number',
                    },
                    lng: {
                      type: 'number',
                    },
                  },
                },
              },
            },
            apartment_details_id: {
              type: 'object',
              properties: {
                rooms: {
                  type: 'integer',
                },
                bedrooms: {
                  type: 'integer',
                },
                bathrooms: {
                  type: 'integer',
                },
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
            VEFA_details_id: {
              type: 'object',
              properties: {
                is_vefa: {
                  type: 'boolean',
                },
                delivery_date: {
                  type: 'string',
                },
                construction_progress: {
                  type: 'string',
                },
              },
            },
            promoter_id: {
              type: 'object',
            },
            views: {
              type: 'integer',
            },
            isFavorited: {
              type: 'boolean',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints pour l\'authentification des utilisateurs',
      },
      {
        name: 'Users',
        description: 'Gestion des profils utilisateurs',
      },
      {
        name: 'Properties',
        description: 'Consultation et recherche de propriétés',
      },
      {
        name: 'Favorites',
        description: 'Gestion des propriétés favorites',
      },
      {
        name: 'Promoters',
        description: 'Informations sur les promoteurs immobiliers',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;