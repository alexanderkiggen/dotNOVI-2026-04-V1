import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/db.js', () => ({
    default: null,
    query: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
}));

const { default: app, server } = await import('../src/index.js');
const request = (await import('supertest')).default;

describe('Health Check Endpoint', () => {
    afterAll(async () => {
        if (server && typeof server.close === 'function') {
            await new Promise((resolve) => server.close(resolve));
        }
    });

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
    });
});