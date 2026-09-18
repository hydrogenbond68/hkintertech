import http from 'http';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { getRedis, closeRedis } from './services/cache.js';
import createRealtimeServer, { closeRealtimeServer } from './services/realtime.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import inquiryRoutes from './routes/inquiries.js';
import wishlistRoutes from './routes/wishlist.js';
import paymentRoutes from './routes/payments.js';
import './models/User.js';
import './models/Product.js';
import './models/Order.js';
import './models/Review.js';
import './models/Inquiry.js';
import './models/Wishlist.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  res.set('x-request-id', req.requestId);
  next();
});

app.use(cors({
  origin: allowedOrigins.includes('*') ? true : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
}));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression({ level: 6 }));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 600),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts' },
});

app.get('/health', async (req, res) => {
  const redis = await getRedis();
  res.json({
    status: 'ok',
    service: 'hk-intertech-api',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redis ? 'connected' : 'degraded',
  });
});

app.get('/ready', async (req, res) => {
  const redis = await getRedis();
  const ready = mongoose.connection.readyState === 1 && Boolean(redis);
  res.status(ready ? 200 : 503).json({
    ready,
    mongodb: mongoose.connection.readyState === 1,
    redis: Boolean(redis),
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', request_id: req.requestId });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.statusCode || error.status || (error.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) console.error(`[${req.requestId}]`, error);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : error.message,
    request_id: req.requestId,
  });
});

createRealtimeServer(server);

await connectDB();

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await closeRealtimeServer();
    await closeRedis();
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Harykims Intertech API listening on port ${port}`);
  });
}

export { app, server };
