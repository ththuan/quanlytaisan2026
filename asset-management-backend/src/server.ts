import { Server } from 'http';
import app from './app';
import envConfig from './config/env';
import { testConnection } from './config/database';
import logger from './utils/logger';
import { startScheduler } from './utils/scheduler';

const PORT = envConfig.port;
const HOST = envConfig.host;

let server: Server | undefined;

const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (!server) {
    process.exit(0);
    return;
  }
  server.close((err) => {
    if (err) {
      logger.error('Error during HTTP server close:', err);
      process.exit(1);
      return;
    }
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 15000).unref();
};

const startServer = async () => {
  try {
    await testConnection();
    server = app.listen(PORT, HOST, () => {
      logger.info(`Server is running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${envConfig.nodeEnv}`);
      logger.info(`API Documentation: http://${HOST}:${PORT}/api/docs`);
    });
    startScheduler();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
