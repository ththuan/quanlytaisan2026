# Performance Optimization Guide

## Tổng quan
Hướng dẫn này cung cấp các chiến lược tối ưu hiệu suất cho hệ thống Quản lý Tài sản.

## 1. Caching Strategy

### 1.1 Memory Cache
Hệ thống sử dụng in-memory cache để giảm tải database queries.

#### Cache Configuration
```env
# Cache TTL (milliseconds)
CACHE_TTL=60000

# Cache size limit (số lượng key tối đa)
CACHE_MAX_SIZE=1000
```

#### Cache Keys
```
assets:list:{page}:{limit}:{filters}      # Danh sách tài sản
assets:detail:{id}                         # Chi tiết tài sản
users:list:{page}:{limit}:{search}         # Danh sách người dùng
departments:list                           # Danh sách phòng ban
statistics:{type}:{year}                   # Thống kê và báo cáo
```

#### Sử dụng Cache
```typescript
// Đọc từ cache
const data = await cache.get('assets:list:1:20');
if (data) {
  res.setHeader('X-Cache', 'HIT');
  return res.json(data);
}

// Ghi vào cache
await cache.set('assets:list:1:20', data, 60000);

// Invalidate cache
await cache.invalidate('assets:*');
```

### 1.2 Cache Invalidation
Tự động invalidate cache khi có thay đổi:

- **CREATE**: Invalidate list cache
- **UPDATE**: Invalidate detail + list cache
- **DELETE**: Invalidate detail + list cache

```typescript
// Ví dụ: Sau khi tạo asset
await assetService.create(data);
await cache.invalidate('assets:*');
```

### 1.3 Cache Headers
```http
X-Cache: HIT          # Response từ cache
X-Cache: MISS         # Response từ database
Cache-Control: max-age=60  # Client-side cache
```

## 2. Database Optimization

### 2.1 Indexes
Các index được tạo để tăng tốc độ query:

```sql
-- Assets
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category_id ON assets(category_id);
CREATE INDEX idx_assets_department_id ON assets(department_id);
CREATE INDEX idx_assets_assigned_to_id ON assets(assigned_to_id);
CREATE INDEX idx_assets_asset_code ON assets(asset_code);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

-- Transfers
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_asset_id ON transfers(asset_id);
```

### 2.2 Query Optimization
- Sử dụng `include` để eager load relations
- Chọn chỉ các fields cần thiết
- Sử dụng pagination cho large datasets

```typescript
// Good
const assets = await Asset.findAll({
  attributes: ['id', 'assetCode', 'name'],
  include: [{ model: Department, attributes: ['name'] }],
  limit: 20,
  offset: 0
});

// Bad - Load tất cả columns và relations
const assets = await Asset.findAll();
```

### 2.3 Connection Pooling
```env
# Database connection pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=10000
```

## 3. API Response Optimization

### 3.1 Pagination
Luôn sử dụng pagination cho danh sách:

```typescript
// Request
GET /api/assets?page=1&limit=20

// Response
{
  "data": {
    "assets": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

### 3.2 Compression
Sử dụng gzip compression:

```typescript
import compression from 'compression';
app.use(compression());
```

### 3.3 Selective Fields
Cho phép client chọn fields:

```typescript
// GET /api/assets?fields=id,name,assetCode
const fields = req.query.fields?.split(',');
const assets = await Asset.findAll({
  attributes: fields || undefined
});
```

## 4. File Upload Optimization

### 4.1 Image Optimization
- Resize images to max 1920x1080
- Compress JPEG/WebP to 80% quality
- Store original + thumbnail versions

```typescript
// Upload với multer
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
```

### 4.2 CDN Integration
Sử dụng CDN cho static files:

```env
CDN_URL=https://cdn.yourdomain.com
```

## 5. Load Balancing

### 5.1 Horizontal Scaling
Chạy nhiều instance backend:

```bash
# Sử dụng PM2
pm2 start ecosystem.config.js -i max

# Hoặc Docker
docker-compose up -d --scale backend=3
```

### 5.2 Load Balancer
Sử dụng Nginx hoặc AWS ELB:

```nginx
upstream backend {
  server localhost:3001;
  server localhost:3002;
  server localhost:3003;
}

server {
  listen 80;
  location /api {
    proxy_pass http://backend;
  }
}
```

## 6. Monitoring & Metrics

### 6.1 Request Logging
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${duration}ms`);
  });
  next();
});
```

### 6.2 Performance Metrics
Theo dõi:
- Request response time (p50, p95, p99)
- Database query time
- Cache hit rate
- Error rate

### 6.3 Health Checks
```bash
# Check server health
GET /health

# Check database connection
GET /health/db

# Check cache status
GET /health/cache
```

## 7. Best Practices

### 7.1 Code Level
- Sử dụng async/await thay vì callbacks
- Tránh N+1 queries với eager loading
- Sử dụng streaming cho large files
- Implement circuit breaker cho external services

### 7.2 Database Level
- Sử dụng connection pooling
- Tạo indexes cho frequently queried columns
- Archive old data để giảm table size
- Sử dụng read replicas cho read-heavy workloads

### 7.3 Infrastructure Level
- Sử dụng CDN cho static assets
- Enable HTTP/2
- Sử dụng SSL/TLS termination
- Implement rate limiting

## 8. Performance Testing

### 8.1 Load Testing
Sử dụng Apache Bench hoặc k6:

```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/assets

# k6
k6 run load-test.js
```

### 8.2 Stress Testing
```bash
# Tăng dần load để tìm breaking point
for i in {1..100}; do
  ab -n 1000 -c $i http://localhost:5000/api/assets
done
```

### 8.3 Profiling
```bash
# Node.js profiling
node --prof dist/server.js
node --prof-process isolate-*.log
```

## 9. Caching Examples

### 9.1 Cache danh sách tài sản
```typescript
// assets.controller.ts
export const getAssets = async (req, res) => {
  const cacheKey = `assets:list:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);

  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const assets = await assetService.findAll(req.query);
  await cache.set(cacheKey, assets, 60000);

  res.setHeader('X-Cache', 'MISS');
  res.json(assets);
};
```

### 9.2 Invalidate cache sau khi update
```typescript
// assets.controller.ts
export const updateAsset = async (req, res) => {
  await assetService.update(req.params.id, req.body);
  await cache.invalidate('assets:*');
  res.json({ success: true });
};
```

## 10. Environment Variables

```env
# Cache
CACHE_TTL=60000
CACHE_MAX_SIZE=1000

# Database Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=10000

# Rate Limiting
RATE_LIMIT_WINDOW=600000  # 10 minutes
RATE_LIMIT_MAX=100        # 100 requests per window

# Compression
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=1024  # 1KB

# Logging
LOG_LEVEL=info
LOG_REQUESTS=true
```

## 11. Monitoring Dashboard

### Prometheus Metrics
```typescript
import client from 'prom-client';

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 300, 500, 1000, 2000, 5000]
});

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path, status_code: res.statusCode });
  });
  next();
});
```

### Grafana Dashboard
- Request rate
- Error rate
- Response time (p50, p95, p99)
- Cache hit rate
- Database query time

## 12. Troubleshooting

### High Memory Usage
```bash
# Check memory usage
node --inspect dist/server.js

# Take heap snapshot
node --heapsnapshot-signal=SIGUSR2 dist/server.js
```

### Slow Database Queries
```typescript
// Enable query logging
const sequelize = new Sequelize({
  logging: (msg) => logger.debug(msg)
});
```

### Cache Issues
```bash
# Clear all cache
curl -X DELETE http://localhost:5000/admin/cache/clear

# Check cache stats
curl http://localhost:5000/admin/cache/stats
```
