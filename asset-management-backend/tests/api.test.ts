import request from 'supertest';
import app from '../src/app';

/**
 * Contract tests kiểu RealWorld:
 * - Endpoint công khai trả đúng envelope
 * - Lỗi luôn có format thống nhất { success: false, message }
 * - Security headers của helmet hiện diện
 * - Auth trả 401 đúng cách
 *
 * Các test này không cần DB/Redis vì chỉ chạm vào middleware/validation.
 */
describe('API contract', () => {
  describe('GET /api/health', () => {
    it('trả về envelope ok và metadata uptime', async () => {
      const res = await request(app).get('/api/health').expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toMatchObject({
        status: 'ok',
        success: true,
        message: 'API is running',
      });
      expect(typeof res.body.timestamp).toBe('string');
      expect(Number.isFinite(res.body.uptime)).toBe(true);
      expect(typeof res.body.environment).toBe('string');
      // Mọi response đều có correlation ID để trace log.
      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });

  describe('Error envelope', () => {
    it('route không tồn tại trả 404 với success=false', async () => {
      const res = await request(app).get('/api/khong-ton-tai').expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('/api/khong-ton-tai');
      expect(res.body.requestId).toBe(res.headers['x-request-id']);
    });

    it('JSON hỏng trả 400 thay vì 500', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"username":');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('JSON');
      expect(res.body.requestId).toBeTruthy();
    });

    it('body rỗng trả 400 kèm thông báo validation', async () => {
      const res = await request(app).post('/api/auth/login').send({}).expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('xác thực');
    });
  });

  describe('Security headers (helmet)', () => {
    it('có các header bảo mật và không lộ X-Powered-By', async () => {
      const res = await request(app).get('/api/health').expect(200);

      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['referrer-policy']).toBeDefined();
    });
  });

  describe('Auth', () => {
    it('thiếu token trả 401', async () => {
      const res = await request(app).get('/api/auth/me').expect(401);

      expect(res.body.success).toBe(false);
    });

    it('token không hợp lệ trả 401', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
    });
  });
});
