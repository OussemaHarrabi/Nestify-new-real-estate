require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectPostgres } = require('./src/config/postgres');
const logger = require('./src/utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Connect to databases
const initializeDatabases = async () => {
  await connectDB(); // MongoDB for properties
  await connectPostgres(); // PostgreSQL for users
};

initializeDatabases();

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`
    🏗️  Nestify Backend Server
    📍 Environment: ${process.env.NODE_ENV}
    🚀 Server running on port ${PORT}
    📚 API Docs: http://localhost:${PORT}/api/docs
    ⏰ Started at: ${new Date().toISOString()}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💤 Process terminated!');
  });
});