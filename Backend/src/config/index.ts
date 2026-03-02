import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV',
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV as string,
    mongoUri: process.env.MONGO_URI as string,
    jwt: {
        secret: process.env.JWT_SECRET as string,
        expires: process.env.JWT_EXPIRES || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET as string,
        refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    // AI keys — optional, app works without them
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    cuelinksApiKey: process.env.CUELINKS_API_KEY || '',
    cuelinksCampaignId: process.env.CUELINKS_CAMPAIGN_ID || '',
} as const;
