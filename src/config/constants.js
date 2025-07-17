module.exports = {
  // Property Types
  PROPERTY_TYPES: {
    APARTMENT: 'Appartement',
    HOUSE: 'Maison',
    VILLA: 'Villa',
    LAND: 'Terrain',
    COMMERCIAL: 'Commercial',
    OFFICE: 'Bureau',
  },

  // User Roles (for future use)
  USER_ROLES: {
    BUYER: 'buyer',
    AGENCY: 'agency',
    ADMIN: 'admin',
  },

  // Languages
  LANGUAGES: {
    FR: 'fr',
    AR: 'ar',
  },

  // VEFA Status
  VEFA_STATUS: {
    PLANNING: 'En planification',
    CONSTRUCTION: 'En cours de construction',
    FINISHING: 'En finition',
    DELIVERED: 'Livré',
  },

  // Features
  PROPERTY_FEATURES: [
    'Garage',
    'Ascenseur',
    'Piscine',
    'Climatisation',
    'Chauffage central',
    'Sécurité',
    'Cuisine équipée',
    'Balcon',
    'Terrasse',
    'Jardin',
    'Cave',
    'Parking visiteurs',
    'Concierge',
    'Interphone',
    'Double vitrage',
    'Porte blindée',
    'Placards',
    'Dressing',
    'Cheminée',
    'Buanderie',
  ],

  // Cities in Tunisia
  TUNISIA_CITIES: [
    'Tunis',
    'Ariana',
    'Ben Arous',
    'Manouba',
    'Nabeul',
    'Zaghouan',
    'Bizerte',
    'Béja',
    'Jendouba',
    'Le Kef',
    'Siliana',
    'Sousse',
    'Monastir',
    'Mahdia',
    'Sfax',
    'Kairouan',
    'Kasserine',
    'Sidi Bouzid',
    'Gabès',
    'Médenine',
    'Tataouine',
    'Gafsa',
    'Tozeur',
    'Kébili',
  ],

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Validation
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    PHONE_REGEX: /^(\+216)?[2459]\d{7}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Error Codes
  ERROR_CODES: {
    // Auth errors
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    AUTH_NO_TOKEN: 'AUTH_NO_TOKEN',
    AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    
    // User errors
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USER_INVALID_PHONE: 'USER_INVALID_PHONE',
    
    // Property errors
    PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
    
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    
    // Server errors
    SERVER_ERROR: 'SERVER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    
    // Rate limit
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    ACCOUNT_CREATED: {
      fr: 'Compte créé avec succès',
      ar: 'تم إنشاء الحساب بنجاح',
    },
    LOGIN_SUCCESS: {
      fr: 'Connexion réussie',
      ar: 'تم تسجيل الدخول بنجاح',
    },
    PROFILE_UPDATED: {
      fr: 'Profil mis à jour avec succès',
      ar: 'تم تحديث الملف الشخصي بنجاح',
    },
    FAVORITE_ADDED: {
      fr: 'Propriété ajoutée aux favoris',
      ar: 'تمت إضافة العقار إلى المفضلة',
    },
    FAVORITE_REMOVED: {
      fr: 'Propriété retirée des favoris',
      ar: 'تمت إزالة العقار من المفضلة',
    },
  },

  // Error Messages
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: {
      fr: 'Email ou mot de passe incorrect',
      ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    },
    USER_EXISTS: {
      fr: 'Un compte existe déjà avec cet email',
      ar: 'يوجد حساب بالفعل بهذا البريد الإلكتروني',
    },
    INVALID_PHONE: {
      fr: 'Numéro de téléphone invalide',
      ar: 'رقم الهاتف غير صالح',
    },
    PROPERTY_NOT_FOUND: {
      fr: 'Propriété introuvable',
      ar: 'العقار غير موجود',
    },
    UNAUTHORIZED: {
      fr: 'Accès non autorisé',
      ar: 'الوصول غير مصرح به',
    },
    SERVER_ERROR: {
      fr: 'Une erreur est survenue, veuillez réessayer',
      ar: 'حدث خطأ، يرجى المحاولة مرة أخرى',
    },
    VALIDATION_ERROR: {
      fr: 'Données invalides',
      ar: 'بيانات غير صالحة',
    },
    TOKEN_EXPIRED: {
      fr: 'Votre session a expiré, veuillez vous reconnecter',
      ar: 'انتهت صلاحية جلستك، يرجى تسجيل الدخول مرة أخرى',
    },
    RATE_LIMIT: {
      fr: 'Trop de requêtes, veuillez réessayer plus tard',
      ar: 'طلبات كثيرة جدا، يرجى المحاولة لاحقا',
    },
  },
};