import { Schema, model, Document } from 'mongoose';

export interface IRefreshToken extends Document {
    token: string;
    userId: Schema.Types.ObjectId;
    expiresAt: Date;
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
    // TTL index — MongoDB will auto-delete expired tokens
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 },
    },
});

export default model<IRefreshToken>('RefreshToken', refreshTokenSchema);
