import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

const app: Express = express();

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
// Required when behind a reverse proxy (nginx, Caddy) so that rate limiting
// uses the real client IP from X-Forwarded-For, not the proxy IP.
app.set('trust proxy', 1);

// ─── Security HTTP Headers ───────────────────────────────────────────────────
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true,
            preload: true,
        },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
);
// Explicitly remove the framework fingerprinting header
app.disable('x-powered-by');

// ─── CORS ────────────────────────────────────────────────────────────────────
// Mobile apps (React Native) send no Origin header, so we allow requests
// without an Origin. Requests with an Origin are checked against the allowlist.
app.use(
    cors({
        origin: (origin, callback) => {
            // Mobile apps / curl / Postman — no Origin header
            if (!origin) return callback(null, true);
            if (config.allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
// Only log requests in development — avoids leaking request details in production
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Global limiter — broad protection against abuse
const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
});

// Auth limiter — strict brute-force protection on login/signup/refresh
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed/rejected requests
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again after 15 minutes.',
    },
});

// Apply global limiter to all API routes
app.use('/api', globalLimiter);

// Apply strict limiter to auth sensitive endpoints
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/signup', authLimiter);
app.use('/api/v1/auth/refresh', authLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check — outside the rate limiter, used by orchestrators
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', environment: config.nodeEnv });
});

app.use('/api/v1', routes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
