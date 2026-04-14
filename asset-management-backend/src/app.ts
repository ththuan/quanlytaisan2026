import express, { Application, Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import envConfig from './config/env';
import logger from './utils/logger';
import routes from './routes';
import scanRoutes from './routes/scan.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logging';
import { cachingMiddleware } from './middleware/caching';

const app: Application = express();

// Trust first proxy hop (Docker/nginx) to get real client IP from X-Forwarded-For
app.set('trust proxy', 1);

app.disable('etag');

// Security middleware
app.use(helmet());

// Caching middleware - applied after security, before routes
app.use(cachingMiddleware);

// CORS - Production: chỉ cho phép CORS_ORIGIN. Development: cho phép localhost + CORS_ORIGIN
const devOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
  'http://localhost:5173',
  'https://localhost:5173',
];
const productionOrigins = envConfig.corsOrigin === '*'
  ? []
  : envConfig.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (envConfig.corsOrigin === '*') {
        return callback(null, true);
      }

      if (envConfig.nodeEnv === 'development') {
        if (
          devOrigins.includes(origin) ||
          origin.startsWith('http://localhost') ||
          origin.startsWith('https://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin.startsWith('https://127.0.0.1') ||
          /^https?:\/\/192\.168\./.test(origin) ||
          /^https?:\/\/172\./.test(origin) ||
          /^https?:\/\/10\./.test(origin)
        ) {
          return callback(null, true);
        }
      }

      if (productionOrigins.includes(origin) || devOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
  })
);

// Compression - Optimized Gzip compression
// Compression middleware sẽ tự động:
// - Kiểm tra Accept-Encoding header từ client
// - Chỉ nén các content type phù hợp (text/html, application/json, text/css, etc.)
// - Bỏ qua các file đã được nén (images, videos, etc.)
app.use(
  compression({
    // Chỉ nén các response có kích thước >= 1KB (1024 bytes)
    // Các file nhỏ hơn không cần nén vì overhead của compression lớn hơn lợi ích
    threshold: 1024,
    // Filter function để kiểm tra xem có nên nén response không
    filter: (req, res) => {
      // Cho phép client yêu cầu không nén thông qua custom header
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Sử dụng filter mặc định của compression middleware
      // Filter mặc định sẽ tự động kiểm tra:
      // - Accept-Encoding header
      // - Content-Type header (chỉ nén text-based content)
      // - Không nén các file đã được nén sẵn (images, videos, etc.)
      return compression.filter(req, res);
    },
    // Level compression: 6 là cân bằng tốt giữa tốc độ và tỷ lệ nén
    // Range: 0-9 (0 = không nén, 9 = nén tối đa nhưng chậm)
    level: 6,
  })
);

// Body parser - Limit configurable (default 10MB). Large base64 images: set BODY_LIMIT=50mb in .env
const bodyLimit = process.env.BODY_LIMIT || '10mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Request logging
app.use(requestLogger);

// Rate limiting for auth endpoints (more lenient)
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10'), // 10 login attempts per 15 minutes (IP-based; per-account lockout is also active)
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng đợi 15 phút rồi thử lại.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// General rate limiting (exclude auth routes)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'), // 500 requests per minute
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for auth routes (they have their own limiter)
    return req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register');
  },
});

// Apply auth rate limiter to auth routes first
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Apply general rate limiter to all other API routes
app.use('/api', limiter);

// API Routes
app.use('/api', routes);

// Scan routes - Trang HTML tra cứu tài sản qua QR (không cần auth, không dưới /api/)
app.use('/scan', scanRoutes);

// Swagger API Documentation (tùy chọn - bỏ qua nếu thiếu module)
import('./swagger')
  .then(({ setupSwagger }) => setupSwagger(app as Express))
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn('[swagger] Bỏ qua (thiếu swagger-ui-express/swagger-jsdoc): %s', msg);
  });

// Serve static files from storage/public with compression and caching
const storagePath = path.join(__dirname, '../storage/public');
app.use(
  '/storage',
  express.static(storagePath, {
    // Enable ETag for cache validation
    etag: true,
    // Set max age for cache control (1 year for static assets)
    maxAge: '1y',
    // Enable last modified header
    lastModified: true,
    // Set cache control headers
    setHeaders: (res, filePath) => {
      // Set appropriate cache headers based on file type
      if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.gif') || filePath.endsWith('.svg')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
      
      // Allow cross-origin resource sharing for static files (needed for COEP/CORP)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
