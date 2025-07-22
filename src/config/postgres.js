const { Sequelize } = require('sequelize');
// const logger = require('../utils/logger');  // Commenté temporairement

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'nestify_users',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,  // Changé
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Test connection
const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');  // Changé
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ PostgreSQL models synchronized');  // Changé
    }
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);  // Changé
    // process.exit(1);  // Commenté pour éviter l'arrêt du serveur
  }
};

module.exports = { sequelize, connectPostgres };