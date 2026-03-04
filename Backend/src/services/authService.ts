import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
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
 * Supported units: s (seconds), m (minutes), h (hours), d (days), w (weeks)
 */
function parseDurationMs(duration: string): number {
  const FALLBACK_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  if (!duration || typeof duration !== 'string') return FALLBACK_MS;

  const match = duration.match(/^(\d+)([smhdwSMHDW])$/);
  if (!match) {
    console.warn(
      `[authService] Unknown JWT duration format: "${duration}". Falling back to 30 days.`,
    );
    return FALLBACK_MS;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60 * 1_000,
    h: 60 * 60 * 1_000,
    d: 24 * 60 * 60 * 1_000,
    w: 7 * 24 * 60 * 60 * 1_000,
  };

  return value * multipliers[unit];
}

/**
 * Generate an access + refresh token pair for the given user.
 *
 * @param user     - The user to generate tokens for
 * @param familyId - Optional family ID to inherit on rotation. If omitted (new login),
 *                   a new UUID is generated. This links the entire rotation chain for
 *                   replay-detection and family-wide invalidation.
 */
export const generateTokenPair = async (user: IUser, familyId?: string): Promise<TokenPair> => {
  const tokenFamilyId = familyId ?? uuidv4(); // New login = new family

  const payload = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expires,
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
    algorithm: 'HS256',
  });

  // Persist refresh token — TTL derived from JWT_REFRESH_EXPIRES env so they stay in sync
  const expiresAt = new Date(Date.now() + parseDurationMs(config.jwt.refreshExpires));

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    familyId: tokenFamilyId,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (
  token: string,
): { id: string; email: string; name: string; role: string } => {
  const decoded = jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
  }) as { id: string; email: string; name: string; role: string };
  return decoded;
};
