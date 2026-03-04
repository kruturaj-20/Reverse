import { z } from "zod";

// Product query params
export const productQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((p) => (p ? Number(p) : 1)),
    limit: z
      .string()
      .optional()
      .transform((l) => (l ? Number(l) : 10)),
    sort: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    minPrice: z
      .string()
      .optional()
      .transform((p) => (p ? Number(p) : undefined)),
    maxPrice: z
      .string()
      .optional()
      .transform((p) => (p ? Number(p) : undefined)),
  }),
});

// Admin product creation payload
export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    price: z.number().positive("Price must be greater than 0"),
    originalPrice: z.number().positive(),
    category: z.string().min(1, "Category is required"),
    brand: z.string().min(1, "Brand is required"),
    stock: z.number().int().nonnegative(),
    images: z
      .array(z.string().url("Must provide valid URLs"))
      .min(1, "At least 1 image URL is required"),
  }),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
});

// Payload for budget bundle endpoint
export const budgetBundleSchema = z.object({
  body: z.object({
    budget: z.number().positive("Budget must be a positive number"),
    categories: z.array(z.string()).min(1, "At least one category is required"),
  }),
});
