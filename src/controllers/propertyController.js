const Property = require('../models/Property');
const mongoose = require('mongoose');

/**
 * Get all properties with filters
 * @route GET /api/v1/properties
 */
const getProperties = async (req, res) => {
  try {
    console.log('=== PROPERTY DEBUG ===');
    console.log('MongoDB connected to:', mongoose.connection.name);
    console.log('Collection name:', Property.collection.name);
    
    // Test direct count
    const count = await Property.countDocuments();
    console.log('Total properties in collection:', count);
    
    // Test direct find
    const testProperties = await Property.find().limit(2);
    console.log('Sample properties found:', testProperties.length);
    console.log('First property sample:', testProperties[0] ? { 
      id: testProperties[0]._id, 
      title: testProperties[0].title 
    } : 'No properties found');
    
    // Simple query for all properties
    const properties = await Property.find({ validated: true })
      .limit(20)
      .lean();
    
    console.log('Filtered properties found:', properties.length);
    
    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          current_page: 1,
          total_pages: Math.ceil(count / 20),
          total_count: count,
          per_page: 20,
          has_next_page: count > 20,
          has_prev_page: false
        }
      }
    });
    
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get single property by ID
 */
const getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).lean();

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: { property }
    });
  } catch (error) {
    console.error('Single property fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getProperties,
  getProperty
};