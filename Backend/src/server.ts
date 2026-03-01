import mongoose from 'mongoose';
import app from './app';
import { config } from './config';
import { connectDB } from './config/database';
import logger from './utils/logger';

// Handle uncaught exceptions synchronously
process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION ➔ Shutting down...');
    logger.error(err.name, err.message, err.stack);
    process.exit(1);
});

async function bootstrap() {
    try {
        // Database Connection
        await connectDB();

        // Start Server
        const server = app.listen(config.port, () => {
            logger.info(
                `🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`
            );
        });

        // Handle asynchronous unhandled rejections
        process.on('unhandledRejection', (reason: Error | any) => {
            logger.error('UNHANDLED REJECTION ➔ Shutting down...');
            logger.error(reason?.name, reason?.message, reason?.stack || reason);
            server.close(() => {
                process.exit(1);
            });
        });

        process.on('SIGTERM', () => {
            logger.info('SIGTERM RECEIVED. Shutting down gracefully');
            server.close(() => {
                logger.info('HTTP server closed');
                mongoose.connection.close(false).then(() => {
                    logger.info('MongoDB connection closed.');
                    process.exit(0);
                });
            });
        });
    } catch (error) {
        logger.error('Error during bootstrap:', error);
        process.exit(1);
    }
}

bootstrap();
