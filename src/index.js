import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query, healthCheck } from './db.js';
import healthRoutes from './routes/health.js';
import notesRoutes from './routes/notes.js';
import { collectDefaultMetrics, register, Counter, Histogram, Gauge } from 'prom-client';

collectDefaultMetrics();

const httpRequests = new Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'path', 'status'] });
const httpDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration in seconds', labelNames: ['method', 'path'], buckets: [0.01, 0.05, 0.1, 0.5, 1, 5] });
const activeConnections = new Gauge({ name: 'http_active_connections', help: 'Number of HTTP requests currently being processed' });

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    if (req.path === '/metrics') return next();
    activeConnections.inc();
    const endTimer = httpDuration.startTimer();
    res.on('finish', () => {
        const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
        httpRequests.inc({ method: req.method, path: route, status: res.statusCode });
        endTimer({ method: req.method, path: route });
        activeConnections.dec();
    });
    next();
});

app.use('/health', healthRoutes);
app.use('/api/notes', notesRoutes);

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.get('/', async (req, res) => {
    try {
        const result = await query('SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC');
        res.render('index', { notes: result.rows });
    } catch (error) {
        res.render('index', { notes: [], error: 'Failed to load notes' });
    }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, _next) => res.status(500).json({ error: 'Internal server error' }));

const server = app.listen(PORT, async () => {
    console.log(`dotNOVI listening on port ${PORT}`);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

export { app, server };
export default app;