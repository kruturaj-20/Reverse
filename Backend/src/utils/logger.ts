import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isProduction = config.nodeEnv === 'production';

// File transport for persistent logs in production (auto-rotates daily, max 14 days / 20 MB)
const fileTransport = new DailyRotateFile({
    dirname: 'logs',
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), errors({ stack: true }), json()),
});

const errorFileTransport = new DailyRotateFile({
    dirname: 'logs',
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: combine(timestamp(), errors({ stack: true }), json()),
});

const transports: winston.transport[] = [
    new winston.transports.Console({
        format: isProduction
            ? combine(timestamp(), json())
            : combine(colorize(), simple()),
    }),
];

if (isProduction) {
    transports.push(fileTransport, errorFileTransport);
}

const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    transports,
    exceptionHandlers: [
        new winston.transports.Console(),
        ...(isProduction ? [new DailyRotateFile({
            dirname: 'logs',
            filename: 'exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '30d',
        })] : []),
    ],
    rejectionHandlers: [
        new winston.transports.Console(),
        ...(isProduction ? [new DailyRotateFile({
            dirname: 'logs',
            filename: 'rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '30d',
        })] : []),
    ],
});

export default logger;
