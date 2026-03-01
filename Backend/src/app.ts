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

// ─── Global Middlewares ──────────────────────────────────────────────────────

// Set Security HTTP Headers
app.use(helmet());

// Enable CORS
app.use(
    cors({
        origin: config.allowedOrigins,
        credentials: true,
    })
);

// Compress Responses
app.use(compression());

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Development Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// Request Limiters
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
});

// Apply limiter to all APIs
app.use('/api', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', environment: config.nodeEnv });
});

app.use('/api/v1', routes);

// ─── Error Handling ──────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
