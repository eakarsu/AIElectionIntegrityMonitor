const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  throw new Error('DATABASE_URL or DB_PASSWORD is required in production');
}
const sequelize = process.env.DATABASE_URL ? new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres', logging: false,
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: true } } : undefined,
}) : new Sequelize(
  process.env.DB_NAME || 'election_integrity',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
