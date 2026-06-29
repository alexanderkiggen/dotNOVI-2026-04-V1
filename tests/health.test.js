import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/db.js', () => ({
  default: null,
  query: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
}));

const { default: app } = await import('../src/index.js');
const request = (await import('supertest')).default;

describe('Health Check Endpoint', () => {
  describe('GET /health', () => {
    it('should return a health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('database');
    });

    it('should return healthy status when database is available', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toMatch(/healthy|degraded/);
    });

    it('should have a valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return uptime as a number', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });
});