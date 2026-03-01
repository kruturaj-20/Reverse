import { z } from 'zod';

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const signupSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
        email: z.string().email('Invalid email address'),
        password: passwordSchema,
        avatar: z.string().url('Avatar must be a valid URL').optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

// Used when creating a new refresh token
export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});

// Used for logout to revoke the refresh token
export const logoutSchema = z.object({
    body: z.object({
        refreshToken: z.string().optional(),
    }),
});
