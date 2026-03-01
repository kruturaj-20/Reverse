import { apiClient } from './apiClient';
import { ApiResponse } from './types';
import { Product } from '../data/mockProducts';

// Wishlist Responses
export interface WishlistResponse {
    userId: string;
    productId: string;
    createdAt: string;
}

export interface WishlistWithProductsResponse {
    wishlist: WishlistResponse[];
    products: Product[];
}

export const wishlistService = {
    // Get all wishlist items including populated products
    async getWishlist(): Promise<ApiResponse<WishlistWithProductsResponse>> {
        const response = await apiClient.get<ApiResponse<WishlistWithProductsResponse>>('/wishlist');
        return response.data;
    },

    // Add item to wishlist
    async addToWishlist(productId: string): Promise<ApiResponse<WishlistResponse>> {
        const response = await apiClient.post<ApiResponse<WishlistResponse>>('/wishlist', { productId });
        return response.data;
    },

    // Remove item from wishlist
    async removeFromWishlist(productId: string): Promise<ApiResponse<null>> {
        const response = await apiClient.delete<ApiResponse<null>>(`/wishlist/${productId}`);
        return response.data;
    },
};
