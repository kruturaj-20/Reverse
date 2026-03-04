/**
 * Refresh Token Family Tracking (N4 fix)
 * ──────────────────────────────────────────────────────────────────────────────
 * Extends the RefreshToken model with a `familyId` — a shared identifier for
 * all tokens in the same rotation chain (login → refresh → refresh → ...).
 *
 * Security behaviour:
 * - Every new login creates a NEW familyId.
 * - Every refresh creates a new token with the SAME familyId.
 * - If a USED (already-deleted) refresh token is presented again (replay attack),
 *   the attacker has the token but the legitimate user should too.
 *   We detect this by checking if a token with that familyId still exists after
 *   the original was deleted — if yes, both tokens were leaked (compromise).
 *   We invalidate ALL tokens in the family on replay detection.
 *
 * This upgrade is backward-compatible — existing tokens without a familyId
 * continue to work normally (reuse detection is skipped when familyId is absent).
 */

import { Schema, model, Document } from 'mongoose';

export interface IRefreshToken extends Document {
    token: string;
    userId: Schema.Types.ObjectId;
    expiresAt: Date;
    /**
     * Shared ID linking all tokens in the same rotation chain.
     * Used for token family invalidation on replay detection.
     */
    familyId: string;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    familyId: {
        type: String,
        required: true,
        index: true, // Indexed for fast family-wide invalidation
    },
    // TTL index — MongoDB auto-deletes expired tokens
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 },
    },
});

export default model<IRefreshToken>('RefreshToken', refreshTokenSchema);
