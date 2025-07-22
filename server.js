const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
require('dotenv').config();

// Comment out all missing files
// const connectDB = require('./src/config/database.js');
// const logger = require('./src/utils/logger.js');
// const errorHandler = require('./src/middleware/error.middleware.js');

// Import routes
const authRoutes = require('./src/routes/auth.routes.js');
const propertyRoutes = require('./src/routes/property.routes.js');
const userRoutes = require('./src/routes/user.routes.js');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug middleware - COMMENTÉ TEMPORAIREMENT
// app.use((req, res, next) => {
//   console.log('=== REQUEST DEBUG ===');
//   console.log('Method:', req.method);
//   console.log('URL:', req.url);
//   console.log('Headers:', req.headers);
//   console.log('Body:', req.body);
//   console.log('Body type:', typeof req.body);
//   console.log('Body empty:', Object.keys(req.body || {}).length === 0);
//   console.log('====================');
//   next();
// });

// Data sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/users', userRoutes);

// MongoDB connection
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Add PostgreSQL connection
const { connectPostgres } = require('./src/config/postgres');
connectPostgres();

// Test endpoint pour MongoDB
app.get('/test-properties', async (req, res) => {
  try {
    const Property = require('./src/models/Property');
    const count = await Property.countDocuments();
    const sample = await Property.findOne();
    
    res.json({
      success: true,
      count: count,
      sample: sample ? { 
        id: sample._id, 
        title: sample.title,
        validated: sample.validated 
      } : null
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Debug: List all collections
app.get('/debug-collections', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const collectionsInfo = await Promise.all(
      collections.map(async (collection) => {
        const count = await db.collection(collection.name).countDocuments();
        return {
          name: collection.name,
          count: count
        };
      })
    );
    
    res.json({
      database: mongoose.connection.name,
      collections: collectionsInfo
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/mongo-status', async (req, res) => {
  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    
    res.json({
      mongooseConnection: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      serverStatus: {
        host: serverStatus.host,
        version: serverStatus.version,
        uptime: serverStatus.uptime
      }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3000;

// Simplified server start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;