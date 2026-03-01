import { apiClient } from './apiClient';
import { ApiResponse } from './types';
import { Product } from '../data/mockProducts'; // Reuse existing interface for now

export const productService = {
    async getProducts(params?: {
        page?: number;
        limit?: number;
        category?: string;
        sort?: string;
    }): Promise<ApiResponse<Product[]>> {
        const response = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
        return response.data;
    },

    async getProductById(id: string): Promise<ApiResponse<Product>> {
        const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
        return response.data;
    },

    async searchProducts(params: {
        q?: string;
        page?: number;
        limit?: number;
        category?: string;
        sort?: string;
    }): Promise<ApiResponse<Product[]>> {
        const response = await apiClient.get<ApiResponse<Product[]>>('/search', { params });
        return response.data;
    },
};
