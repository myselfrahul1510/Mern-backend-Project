const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');
const client = require('prom-client');

dotenv.config();

const app = express();

app.disable('x-powered-by');

const allowedOrigins = new Set(
    (process.env.CORS_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS origin is not allowed'));
    }
};

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Middleware to track metrics
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode
        });
        httpRequestDuration.observe({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode
        }, duration);
    });
    next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.use('/api/tasks', taskRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only connect to DB and start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    connectDB();
    app.listen(PORT, '0.0.0.0', () => {
        console.log('Server running on port ' + PORT + ' in ' + process.env.NODE_ENV + ' mode');
    });
}

module.exports = app;
