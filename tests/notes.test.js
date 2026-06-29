import { jest } from '@jest/globals';
import { register } from 'prom-client';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/db.js', () => ({
    default: null,
    query: mockQuery,
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
}));

const { default: app, server } = await import('../src/index.js');
const request = (await import('supertest')).default;

describe('Notes API', () => {
    afterAll(async () => {
        register.clear(); // Stopt prom-client timers
        if (server && typeof server.close === 'function') {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    beforeEach(() => { mockQuery.mockReset(); });

    describe('GET /api/notes', () => {
        it('should return an array of notes', async () => {
            mockQuery.mockResolvedValue({ rows: [] });
            const response = await request(app).get('/api/notes').expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return notes with required fields', async () => {
            mockQuery.mockResolvedValue({
                rows: [{ id: 1, title: 'Test', content: 'Content', created_at: new Date().toISOString() }],
            });
            const response = await request(app).get('/api/notes').expect(200);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('id');
                expect(response.body[0]).toHaveProperty('title');
            }
        });
    });

    describe('POST /api/notes', () => {
        it('should create a new note', async () => {
            const newNote = { title: 'Test Note', content: 'Content' };
            mockQuery.mockResolvedValue({
                rows: [{ id: 1, ...newNote, created_at: new Date().toISOString() }],
            });
            const response = await request(app).post('/api/notes').send(newNote).expect(201);
            expect(response.body.title).toBe(newNote.title);
        });

        it('should require title and content', async () => {
            await request(app).post('/api/notes').send({ title: 'Test' }).expect(400);
        });
    });

    describe('GET /api/notes/:id', () => {
        it('should return 404 for non-existent note', async () => {
            mockQuery.mockResolvedValue({ rows: [] });
            await request(app).get('/api/notes/99999').expect(404);
        });
    });

    describe('PUT /api/notes/:id', () => {
        it('should require title and content for update', async () => {
            await request(app).put('/api/notes/1').send({ title: 'Test' }).expect(400);
        });
    });

    describe('DELETE /api/notes/:id', () => {
        it('should return 404 for non-existent note', async () => {
            mockQuery.mockResolvedValue({ rows: [] });
            await request(app).delete('/api/notes/99999').expect(404);
        });
    });

    describe('Invalid routes', () => {
        it('should return 404 for unknown routes', async () => {
            await request(app).get('/api/invalid').expect(404);
        });
    });
});