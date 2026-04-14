import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  host: string;
  corsOrigin: string;
  frontendUrl: string;
  logLevel: string;
  logFilePath: string;
}

const envConfig: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFilePath: process.env.LOG_FILE_PATH || path.join(__dirname, '../../logs'),
};

export default envConfig;
