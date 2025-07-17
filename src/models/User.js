// src/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      // Tunisian phone number validation (+216 followed by 8 digits)
      is: /^(\+216)?[2-9][0-9]{7}$/,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'agent', 'admin'),
    defaultValue: 'user'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      propertyTypes: [], // ['appartement', 'villa', 'terrain']
      regions: [], // ['tunis', 'ariana', 'ben_arous']
      priceRange: {
        min: 0,
        max: 1000000
      },
      surfaceRange: {
        min: 0,
        max: 500
      },
      features: [], // ['parking', 'elevator', 'garden']
      notifications: {
        email: true,
        sms: false,
        newListings: true,
        priceAlerts: true
      }
    }
  },
  coordinates: {
    type: DataTypes.JSONB,
    defaultValue: null,
    validate: {
      isValidCoordinates(value) {
        if (value && (!value.lat || !value.lng)) {
          throw new Error('Coordinates must include both lat and lng');
        }
        if (value && (value.lat < -90 || value.lat > 90)) {
          throw new Error('Latitude must be between -90 and 90');
        }
        if (value && (value.lng < -180 || value.lng > 180)) {
          throw new Error('Longitude must be between -180 and 180');
        }
      }
    }
  },
  favorites: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  searchHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  avatar: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  verificationToken: {
    type: DataTypes.STRING
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpires: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['phone'], unique: true },
    { fields: ['coordinates'], using: 'gin' },
    { fields: ['preferences'], using: 'gin' },
    { fields: ['isActive'] },
    { fields: ['role'] }
  ],
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.addToFavorites = function(propertyId) {
  if (!this.favorites.includes(propertyId)) {
    this.favorites.push(propertyId);
  }
  return this.save();
};

User.prototype.removeFromFavorites = function(propertyId) {
  this.favorites = this.favorites.filter(id => id !== propertyId);
  return this.save();
};

User.prototype.addToSearchHistory = function(searchQuery) {
  const maxHistorySize = 50;
  
  // Remove duplicate if exists
  this.searchHistory = this.searchHistory.filter(
    item => JSON.stringify(item.query) !== JSON.stringify(searchQuery)
  );
  
  // Add new search to beginning
  this.searchHistory.unshift({
    query: searchQuery,
    timestamp: new Date(),
    results_count: searchQuery.results_count || 0
  });
  
  // Keep only last maxHistorySize searches
  if (this.searchHistory.length > maxHistorySize) {
    this.searchHistory = this.searchHistory.slice(0, maxHistorySize);
  }
  
  return this.save();
};

User.prototype.updateLocation = function(coordinates) {
  this.coordinates = coordinates;
  return this.save();
};

User.prototype.toSafeObject = function() {
  const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = this.toJSON();
  return safeUser;
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findByPhone = function(phone) {
  return this.findOne({ where: { phone } });
};

module.exports = User;