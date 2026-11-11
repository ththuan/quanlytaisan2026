import { Server } from 'http';
import envConfig from './config/env';
import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import { initRateLimitStore } from './config/rateLimiter';
import { initWebPush } from './config/webPush';
import logger from './utils/logger';
import { startScheduler } from './utils/scheduler';
import { ensureDefaultAdminAccount } from './utils/ensureDefaultAdminAccount';

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
    await connectRedis();
    initRateLimitStore();
    initWebPush();
    // Chỉ worker đầu tiên kiểm tra/tạo admin mặc định, tránh 4 worker ghi đè nhau.
    const instanceId = process.env.NODE_APP_INSTANCE;
    if (instanceId === undefined || instanceId === '' || instanceId === '0') {
      try {
        await ensureDefaultAdminAccount();
        logger.info('Default admin account check completed');
      } catch (error) {
        logger.error('Failed to ensure default admin account:', error);
      }
    }
    // Import app sau khi Redis đã sẵn sàng để rate limiter dùng Redis store chia sẻ.
    const { default: app } = await import('./app');
    server = app.listen(PORT, HOST, () => {
      logger.info(`Server is running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${envConfig.nodeEnv}`);
      logger.info(`API Documentation: http://${HOST}:${PORT}/api-docs`);
    });
    // Giữ kết nối lâu hơn nginx upstream keepalive (65s) để tránh 502 khi tái sử dụng connection.
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
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
