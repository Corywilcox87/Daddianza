const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts' },
});
app.use('/api/auth/login', authLimiter);

// Body parsing — stripe webhook needs raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Serve built frontend in production
if (config.nodeEnv === 'production') {
  const path = require('path');
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
}

// Health check
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'Daddianza CRM API',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

// API routes
app.use('/api', routes);

// SPA fallback for non-API routes in production
if (config.nodeEnv === 'production') {
  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// 404 handler (dev only)
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint not found' }));

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(config.port, () => {
  logger.info(`Daddianza CRM API running on port ${config.port} [${config.nodeEnv}]`);
});

module.exports = app;
