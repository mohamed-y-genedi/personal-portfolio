require('dotenv').config();
require('./instrument');

const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (restrict to known frontend origins)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser tools (Postman/cURL) that may send no Origin header
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS blocked: origin not allowed'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 204
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok'
    });
});

const contactRoute = require('./routes/contact');
app.use('/api/contact', contactRoute);

// Register Sentry error handler before any other error middleware.
Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, next) => {
    const sentryId = res.sentry || null;
    console.error('[API ERROR]', {
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        sentryId
    });
    if (err.stack) {
        console.error(err.stack);
    }

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        sentryId
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
