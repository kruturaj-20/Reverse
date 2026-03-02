import { z } from 'zod';

export const searchQuerySchema = z.object({
    query: z.object({
        q: z.string().max(300, 'Search query must not exceed 300 characters').optional(),
        page: z.string().optional().transform(p => (p ? Number(p) : 1)),
        limit: z
            .string()
            .optional()
            .transform(l => Math.min(Number(l) || 20, 50)), // Cap at 50
        category: z.string().max(100, 'Category filter too long').optional(),
        brand: z.string().max(100, 'Brand filter too long').optional(),
        maxPrice: z.string().optional().transform(p => (p ? Number(p) : undefined)),
        minPrice: z.string().optional().transform(p => (p ? Number(p) : undefined)),
    }),
});
