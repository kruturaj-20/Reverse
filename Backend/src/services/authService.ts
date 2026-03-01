import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../models/User';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export const generateTokenPair = (user: IUser): TokenPair => {
    const payload = {
        id: (user as any)._id.toString(),
        email: user.email,
        name: user.name,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expires as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpires as any,
    });

    return { accessToken, refreshToken };
};

export const verifyRefreshToken = (
    token: string
): { id: string; email: string; name: string } => {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
        id: string;
        email: string;
        name: string;
    };
    return decoded;
};
