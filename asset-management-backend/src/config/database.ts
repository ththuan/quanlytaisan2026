import { Sequelize, Options } from 'sequelize';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const dbConfig: Options = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'asset_management',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '5', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  timezone: '+07:00', // Vietnam timezone
};

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', { error });
    throw error;
  }
};

export { sequelize, dbConfig };
export default sequelize;
