import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

const app: Express = express();

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
// Required when behind a reverse proxy (nginx, Caddy) so that rate limiting
// uses the real client IP from X-Forwarded-For, not the proxy IP.
// Set to the number of actual proxies in front of the server. Use 1 for Render/Railway,
// or set TRUST_PROXY_HOPS env var for multi-hop setups (e.g., 2 for AWS ALB + nginx).
app.set('trust proxy', parseInt(process.env.TRUST_PROXY_HOPS || '1', 10));

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

// ─── Request Correlation ID ──────────────────────────────────────────────────
// Assigns a unique UUID to every request. Returned as X-Request-Id response
// header and attached to req for use in logs — enables distributed tracing.
app.use((req: Request & { id?: string }, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    (req as any).id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
});

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

// ─── NoSQL Injection Prevention ──────────────────────────────────────────────
// Strips MongoDB operator keys (e.g. $gt, $where) from req.body, req.query,
// and req.params — prevents operator injection attacks even when Mongoose
// parameterizes queries, because the operators may reach raw aggregation stages.
app.use(
    mongoSanitize({
        allowDots: true, // Allow dot notation for nested fields (e.g. shippingAddress.city)
        replaceWith: '_', // Replace $ with _ instead of removing — gives cleaner error messages
        onSanitize: ({ req: sanitizedReq, key }) => {
            logger.warn({
                message: 'NoSQL injection attempt detected and sanitized',
                key,
                ip: sanitizedReq.ip,
                path: sanitizedReq.path,
            });
        },
    })
);

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
// Use 'combined' (Apache format) in production, piped to Winston for persistent log files.
// Use 'dev' (colourised short format) in development.
const morganFormat = config.nodeEnv === 'production' ? 'combined' : 'dev';
app.use(
    morgan(morganFormat, {
        stream: { write: (message: string) => logger.http(message.trim()) },
        // Skip health-check pings from polluting logs
        skip: (_req: Request) => _req.url === '/health',
    })
);

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

// Health check — outside the rate limiter, used by orchestrators.
// Do NOT expose environment in production (reduces server fingerprinting surface).
app.get('/health', (_req: Request, res: Response) => {
    const body: Record<string, string> = { status: 'OK' };
    if (config.nodeEnv !== 'production') {
        body.environment = config.nodeEnv;
    }
    res.status(200).json(body);
});

app.use('/api/v1', routes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
