import { apiClient } from './apiClient';
import { ApiResponse } from './types';
import { Product } from '../data/mockProducts';

export interface CartItem {
    productId: string;
    quantity: number;
    price: number;
    product?: Product; // Populated from backend
}

export interface CartResponse {
    userId: string;
    items: CartItem[];
    totalPrice: number;
}

export const cartService = {
    // Get current user's cart
    async getCart(): Promise<ApiResponse<CartResponse>> {
        const response = await apiClient.get<ApiResponse<CartResponse>>('/cart');
        return response.data;
    },

    // Add/Update item in cart
    async addToCart(productId: string, quantity: number): Promise<ApiResponse<CartResponse>> {
        const response = await apiClient.post<ApiResponse<CartResponse>>('/cart/add', { productId, quantity });
        return response.data;
    },

    // Remove item entirely from cart
    async removeFromCart(productId: string): Promise<ApiResponse<CartResponse>> {
        const response = await apiClient.post<ApiResponse<CartResponse>>('/cart/remove', { productId });
        return response.data;
    },
};
