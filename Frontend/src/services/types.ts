export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
    success: boolean;
    error: string;
    errors?: Record<string, string[]>;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Product shape as returned by the backend API.
 * Used in cart, wishlist, and product screens — do NOT import Product from mockProducts
 * in production code paths.
 */
export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    discount: number;
    rating: number;
    reviewCount: number;
    images: string[];
    category: string;
    brand: string;
    stock: number;
    createdAt: string;
}
