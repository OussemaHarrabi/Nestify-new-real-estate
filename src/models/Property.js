const mongoose = require('mongoose');
const { PROPERTY_TYPES, VEFA_STATUS, PROPERTY_FEATURES } = require('../config/constants');

// Embedded schemas
const locationSchema = new mongoose.Schema({
  address: String,
  city: {
    type: String,
    required: true,
    index: true,
  },
  district: String,
  region: String,
  country: {
    type: String,
    default: 'Tunisie',
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },
}, { _id: false });

const vefaDetailsSchema = new mongoose.Schema({
  is_vefa: {
    type: Boolean,
    default: false,
  },
  delivery_date: String,
  construction_progress: {
    type: String,
    enum: Object.values(VEFA_STATUS),
  },
  payment_schedule: [{
    percentage: Number,
    description: String,
    dueDate: String,
  }],
  guarantees: [String],
}, { _id: false });

const apartmentDetailsSchema = new mongoose.Schema({
  rooms: Number,
  bedrooms: Number,
  bathrooms: Number,
  floor: Number,
  total_floors: Number,
  parking: Boolean,
  elevator: Boolean,
  terrace: Boolean,
  garden: Boolean,
  features: [{
    type: String,
    enum: PROPERTY_FEATURES,
  }],
}, { _id: false });

// Main property schema
const propertySchema = new mongoose.Schema({
  _id: {
    type: String, // Custom ID like "mubawab_8104601"
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    index: 'text', // Enable text search
  },
  description: {
    type: String,
    required: true,
    index: 'text', // Enable text search
  },
  published_date: {
    type: Date,
    default: Date.now,
  },
  reference: {
    type: String,
    unique: true,
    sparse: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(PROPERTY_TYPES),
    required: true,
    index: true,
  },
  surface: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  rental_potential: String,
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL',
    },
  }],
  views: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  validated: {
    type: Boolean,
    default: true,
    index: true,
  },
  location_id: {
    type: locationSchema,
    required: true,
  },
  VEFA_details_id: vefaDetailsSchema,
  apartment_details_id: apartmentDetailsSchema,
  promoter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promoter',
    required: true,
  },
  // Additional fields for search optimization
  pricePerM2: {
    type: Number,
  },
  searchKeywords: [String], // For better search
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for performance
propertySchema.index({ 'location_id.city': 1, type: 1, price: 1 });
propertySchema.index({ 'location_id.coordinates': '2dsphere' }); // Geospatial index
propertySchema.index({ created_at: -1 });
propertySchema.index({ views: -1 });
propertySchema.index({ 'VEFA_details_id.is_vefa': 1 });
propertySchema.index({ 'VEFA_details_id.delivery_date': 1 });
propertySchema.index({ 'apartment_details_id.rooms': 1 });
propertySchema.index({ promoter_id: 1 });

// Calculate price per m2 before saving
propertySchema.pre('save', function(next) {
  if (this.price > 0 && this.surface > 0) {
    this.pricePerM2 = Math.round(this.price / this.surface);
  }
  next();
});

// Instance method to increment views
propertySchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

// Instance method to check if delivery date has passed
propertySchema.methods.isDeliveryDatePassed = function() {
  if (!this.VEFA_details_id?.delivery_date) return false;
  
  // Parse French date format (e.g., "avril 2025")
  const months = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };
  
  const [month, year] = this.VEFA_details_id.delivery_date.toLowerCase().split(' ');
  if (months[month] !== undefined && year) {
    const deliveryDate = new Date(parseInt(year), months[month]);
    return deliveryDate < new Date();
  }
  
  return false;
};

// Static method for advanced search
propertySchema.statics.search = async function(filters = {}) {
  const query = { validated: true };
  
  // City filter
  if (filters.city) {
    query['location_id.city'] = new RegExp(filters.city, 'i');
  }
  
  // Type filter
  if (filters.type) {
    query.type = filters.type;
  }
  
  // Price range
  if (filters.priceMin || filters.priceMax) {
    query.price = {};
    if (filters.priceMin) query.price.$gte = filters.priceMin;
    if (filters.priceMax) query.price.$lte = filters.priceMax;
  }
  
  // Surface range
  if (filters.surfaceMin || filters.surfaceMax) {
    query.surface = {};
    if (filters.surfaceMin) query.surface.$gte = filters.surfaceMin;
    if (filters.surfaceMax) query.surface.$lte = filters.surfaceMax;
  }
  
  // Rooms
  if (filters.rooms) {
    query['apartment_details_id.rooms'] = filters.rooms;
  }
  
  // Features
  if (filters.features && Array.isArray(filters.features)) {
    query['apartment_details_id.features'] = { $all: filters.features };
  }
  
  // VEFA filter
  if (filters.isVefa !== undefined) {
    query['VEFA_details_id.is_vefa'] = filters.isVefa;
  }
  
  // Delivery date filter
  if (filters.deliveryDateBefore) {
    // This would need more complex logic to parse French dates
    query['VEFA_details_id.delivery_date'] = { $exists: true };
  }
  
  return query;
};

// Static method to find similar properties
propertySchema.statics.findSimilar = async function(propertyId, limit = 6) {
  const property = await this.findById(propertyId);
  if (!property) return [];
  
  const query = {
    _id: { $ne: propertyId },
    validated: true,
    type: property.type,
    'location_id.city': property.location_id.city,
    price: {
      $gte: property.price * 0.8,
      $lte: property.price * 1.2,
    },
    surface: {
      $gte: property.surface * 0.8,
      $lte: property.surface * 1.2,
    },
  };
  
  return this.find(query)
    .limit(limit)
    .sort('-views')
    .populate('promoter_id');
};

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;