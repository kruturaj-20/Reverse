import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
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

    // Persist refresh token in the store so it can be revoked
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Match JWT_REFRESH_EXPIRES

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
