require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Property = require('../src/models/Property');
const Promoter = require('../src/models/Promoter');
const logger = require('../src/utils/logger');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB for seeding');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Import promoters from properties data
 */
const importPromoters = async (properties) => {
  const promotersMap = new Map();
  
  // Extract unique promoters
  for (const property of properties) {
    if (property.promoter_id && property.promoter_id.name) {
      const promoterData = property.promoter_id;
      if (!promotersMap.has(promoterData.name)) {
        promotersMap.set(promoterData.name, promoterData);
      }
    }
  }
  
  logger.info(`Found ${promotersMap.size} unique promoters`);
  
  // Import promoters
  const promoterIds = new Map();
  
  for (const [name, promoterData] of promotersMap) {
    try {
      let promoter = await Promoter.findOne({ name: promoterData.name });
      
      if (!promoter) {
        promoter = await Promoter.create({
          name: promoterData.name,
          contact: promoterData.contact || {},
          verified: promoterData.verified || false,
        });
        logger.info(`Created promoter: ${name}`);
      } else {
        logger.info(`Promoter already exists: ${name}`);
      }
      
      promoterIds.set(name, promoter._id);
    } catch (error) {
      logger.error(`Error creating promoter ${name}:`, error);
    }
  }
  
  return promoterIds;
};

/**
 * Import properties
 */
const importProperties = async (properties, promoterIds) => {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const propertyData of properties) {
    try {
      // Check if property already exists
      const exists = await Property.findById(propertyData._id);
      if (exists) {
        logger.info(`Property already exists: ${propertyData._id}`);
        skipped++;
        continue;
      }
      
      // Get promoter ID
      const promoterName = propertyData.promoter_id?.name;
      const promoterId = promoterIds.get(promoterName);
      
      if (!promoterId) {
        logger.warn(`Promoter not found for property ${propertyData._id}: ${promoterName}`);
        errors++;
        continue;
      }
      
      // Prepare property data
      const property = {
        ...propertyData,
        promoter_id: promoterId,
        created_at: propertyData.created_at || new Date(),
        validated: propertyData.validated !== false,
      };
      
      // Create property
      await Property.create(property);
      imported++;
      
      if (imported % 100 === 0) {
        logger.info(`Imported ${imported} properties...`);
      }
    } catch (error) {
      logger.error(`Error importing property ${propertyData._id}:`, error);
      errors++;
    }
  }
  
  return { imported, skipped, errors };
};

/**
 * Main seeding function
 */
const seed = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Read data file
    const dataPath = process.argv[2] || path.join(__dirname, '../data/properties.json');
    logger.info(`Reading data from: ${dataPath}`);
    
    const rawData = await fs.readFile(dataPath, 'utf8');
    const properties = JSON.parse(rawData);
    
    if (!Array.isArray(properties)) {
      throw new Error('Data must be an array of properties');
    }
    
    logger.info(`Found ${properties.length} properties to import`);
    
    // Import promoters first
    const promoterIds = await importPromoters(properties);
    
    // Import properties
    const result = await importProperties(properties, promoterIds);
    
    logger.info('Import completed:', result);
    
    // Update promoter statistics
    logger.info('Updating promoter statistics...');
    const promoters = await Promoter.find();
    for (const promoter of promoters) {
      await promoter.updateStatistics();
    }
    
    logger.info('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

/**
 * Additional utility functions
 */
const clearDatabase = async () => {
  try {
    await connectDB();
    
    await Property.deleteMany({});
    await Promoter.deleteMany({});
    
    logger.info('Database cleared');
    process.exit(0);
  } catch (error) {
    logger.error('Error clearing database:', error);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv.includes('--clear')) {
  clearDatabase();
} else {
  seed();
}

/**
 * Usage:
 * npm run seed                    # Import from default location
 * npm run seed /path/to/data.json # Import from custom location
 * npm run seed -- --clear         # Clear database
 */