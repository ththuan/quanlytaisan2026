const dotenv = require('dotenv');

dotenv.config();

const baseConfig = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'asset_management',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
};

module.exports = {
  development: {
    ...baseConfig,
    logging: console.log,
  },
  test: {
    ...baseConfig,
    database: `${baseConfig.database}_test`,
    logging: false,
  },
  production: {
    ...baseConfig,
    logging: false,
  },
};
