import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import envConfig from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logging';

const app: Application = express();

// Trust first proxy hop (Docker/nginx) to get real client IP from X-Forwarded-For
app.set('trust proxy', 1);

app.disable('etag');

// Security middleware
app.use(helmet());

// CORS - Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  envConfig.corsOrigin,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // In development, allow localhost (all variants) and any IP
      if (envConfig.nodeEnv === 'development') {
        if (
          origin.startsWith('http://localhost') || 
          origin.startsWith('https://localhost') || 
          origin.startsWith('http://127.0.0.1') || 
          origin.startsWith('https://127.0.0.1') ||
          /^https?:\/\/192\.168\./.test(origin) || // Local network IP
          /^https?:\/\/172\./.test(origin)      || // Docker network IP
          /^https?:\/\/10\./.test(origin)             // Private network IP
        ) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin) || envConfig.corsOrigin === '*') {
        callback(null, true);
      } else {
        // Fallback to allowing everything in development if not explicitly denied
        if (envConfig.nodeEnv === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
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

// Body parser - Increased limit to handle large base64 images in damage_images field
// Base64 images can be quite large (1.8MB+), so we need a higher limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting for auth endpoints (more lenient)
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '20'), // 20 login attempts per 15 minutes
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
