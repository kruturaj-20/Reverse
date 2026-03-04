import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * Parse a JWT duration string (e.g. "30d", "7d", "24h", "15m") into milliseconds.
 * Keeps the DB TTL in sync with the JWT expiry so stale tokens are auto-cleaned.
 */
function parseDurationMs(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);
    if (isNaN(value)) return 30 * 24 * 60 * 60 * 1000; // Fallback: 30 days

    const multipliers: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    };
    return (multipliers[unit] ?? multipliers['d']) * value;
}

export const generateTokenPair = async (user: IUser): Promise<TokenPair> => {
    const payload = {
        id: (user as any)._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expires as any,
        algorithm: 'HS256',
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpires as any,
        algorithm: 'HS256',
    });

    // Persist refresh token — TTL derived from JWT_REFRESH_EXPIRES env so they stay in sync
    const expiresAt = new Date(Date.now() + parseDurationMs(config.jwt.refreshExpires));

    await RefreshToken.create({
        token: refreshToken,
        userId: (user as any)._id,
        expiresAt,
    });

    return { accessToken, refreshToken };
};

export const verifyRefreshToken = (
    token: string
): { id: string; email: string; name: string; role: string } => {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        algorithms: ['HS256'],
    }) as { id: string; email: string; name: string; role: string };
    return decoded;
};
