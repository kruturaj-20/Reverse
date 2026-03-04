import { Request, Response } from 'express';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { generateTokenPair, verifyRefreshToken } from '../services/authService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       409:
 *         description: Email already registered
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, avatar } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email is already registered', 409);

  const user = await User.create({ name, email, password, avatar: avatar || '' });
  const tokens = await generateTokenPair(user);

  sendSuccess(res, { user, ...tokens }, 'Account created successfully', 201);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in existing user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid credentials
 */
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

  // Cryptographic verification
  const decoded = verifyRefreshToken(token);

  // Check if this token exists in the store
  const stored = await RefreshToken.findOne({ token });

  if (!stored) {
    // Token doesn't exist — it was already used (rotated) or revoked.
    // This could be a replay attack. If we have familyId from the JWT payload,
    // invalidate ALL tokens in the family to protect the legitimate user.
    //
    // How replay detection works:
    //   1. Legitimate flow: token used → deleted → new token created with same familyId
    //   2. Replay attack: attacker reuses the deleted token → we see it's gone → nuke the family
    const familyTokens = await RefreshToken.find({ userId: decoded.id });
    if (familyTokens.length > 0) {
      // Invalidate all tokens for this user (conservative approach — protects them)
      await RefreshToken.deleteMany({ userId: decoded.id });
    }
    throw new AppError('Refresh token has been revoked or reused. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User not found', 401);

  // Rotate: delete old token, issue new pair — carry the familyId forward
  const familyId = stored.familyId;
  await RefreshToken.deleteOne({ token });
  const tokens = await generateTokenPair(user, familyId);

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

export const getMe = asyncHandler(
  async (req: Request & { user?: { id: string } }, res: Response) => {
    const user = await User.findById(req.user?.id);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user, 'Profile fetched successfully');
  },
);
