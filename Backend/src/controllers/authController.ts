import { Request, Response } from 'express';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { generateTokenPair, verifyRefreshToken } from '../services/authService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

// ─── Controllers ─────────────────────────────────────────────────────────────

export const signup = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, avatar } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email is already registered', 409);

    const user = await User.create({ name, email, password, avatar: avatar || '' });
    const tokens = await generateTokenPair(user);

    sendSuccess(
        res,
        { user, ...tokens },
        'Account created successfully',
        201
    );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    const tokens = await generateTokenPair(user);

    // Return user without password (toJSON transform handles this)
    const userObj = user.toJSON();
    sendSuccess(res, { user: userObj, ...tokens }, 'Logged in successfully');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token is required', 400);

    // Verify token cryptographically
    const decoded = verifyRefreshToken(token);

    // Verify it exists in the store — proves it hasn't been revoked/used
    const stored = await RefreshToken.findOne({ token });
    if (!stored) throw new AppError('Invalid or revoked refresh token', 401);

    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User not found', 401);

    // Rotate: delete old token, issue new pair
    await RefreshToken.deleteOne({ token });
    const tokens = await generateTokenPair(user);

    sendSuccess(res, tokens, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    // Revoke the refresh token from the store
    if (refreshToken) {
        await RefreshToken.deleteOne({ token: refreshToken });
    }

    sendSuccess(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req: Request & { user?: { id: string } }, res: Response) => {
    const user = await User.findById(req.user?.id);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user, 'Profile fetched successfully');
});
