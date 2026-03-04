import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
] as const;

const warnIfMissingEnvVars = ['RAPIDAPI_KEY', 'GEMINI_API_KEY', 'CUELINKS_API_KEY'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Warn but don't crash for optional keys — app degrades gracefully without them
for (const envVar of warnIfMissingEnvVars) {
  if (!process.env[envVar]) {
    console.warn(
      `[config] Optional env var ${envVar} is not set. Related features will be disabled.`,
    );
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV as string,
  mongoUri: process.env.MONGO_URI as string,
  // Configure how many reverse proxy hops are in front of the app.
  // 1 = single nginx/Caddy (Render/Railway), 2 = AWS ALB + nginx, etc.
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS || '1', 10),
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
  // Read allowed origins as comma-separated list, trim whitespace and filter out empty entries.
  allowedOrigins: (() => {
    const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);
    if (origins.includes('*')) {
      throw new Error(
        "ALLOWED_ORIGINS must not contain wildcard '*'; please specify explicit domains",
      );
    }
    if (origins.length === 0) {
      console.warn(
        '[config] ALLOWED_ORIGINS is empty; CORS will reject all requests with an Origin header.',
      );
    }
    return origins;
  })(),
  // AI keys — optional, app degrades gracefully without them
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  cuelinksApiKey: process.env.CUELINKS_API_KEY || '',
  cuelinksCampaignId: process.env.CUELINKS_CAMPAIGN_ID || '',
  rapidApiKey: process.env.RAPIDAPI_KEY || '',
  // Razorpay credentials — required; validated at startup above
  razorpayKeyId: process.env.RAZORPAY_KEY_ID as string,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET as string,
  // Redis — optional; caching is bypassed if not configured
  redisUrl: process.env.REDIS_URL || '',
} as const;
