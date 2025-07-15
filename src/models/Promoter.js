const mongoose = require('mongoose');

const promoterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  contact: {
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    website: String,
    addresses: [String],
    additional_phones: [String],
  },
  verified: {
    type: Boolean,
    default: false,
    index: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalProjects: {
    type: Number,
    default: 0,
  },
  description: String,
  logo: String,
  establishedYear: Number,
  socialMedia: {
    facebook: String,
    instagram: String,
    linkedin: String,
  },
  statistics: {
    totalProperties: {
      type: Number,
      default: 0,
    },
    soldProperties: {
      type: Number,
      default: 0,
    },
    activeProperties: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
promoterSchema.index({ name: 'text' });
promoterSchema.index({ verified: 1, rating: -1 });

// Virtual for properties
promoterSchema.virtual('properties', {
  ref: 'Property',
  localField: '_id',
  foreignField: 'promoter_id',
});

// Instance method to update statistics
promoterSchema.methods.updateStatistics = async function() {
  const Property = mongoose.model('Property');
  
  const stats = await Property.aggregate([
    { $match: { promoter_id: this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$validated', true] }, 1, 0] }
        },
      },
    },
  ]);
  
  if (stats.length > 0) {
    this.statistics.totalProperties = stats[0].total;
    this.statistics.activeProperties = stats[0].active;
    await this.save();
  }
};

// Static method to find verified promoters
promoterSchema.statics.findVerified = function() {
  return this.find({ verified: true }).sort('-rating');
};

// Static method to search promoters
promoterSchema.statics.search = function(searchTerm) {
  return this.find({
    $or: [
      { name: new RegExp(searchTerm, 'i') },
      { 'contact.phone': new RegExp(searchTerm, 'i') },
      { 'contact.email': new RegExp(searchTerm, 'i') },
    ],
  });
};

const Promoter = mongoose.model('Promoter', promoterSchema);

module.exports = Promoter;