import { apiClient } from './apiClient';
import { ApiResponse } from './types';
import { Product } from '../data/mockProducts'; // Reuse existing interface for now

export const productService = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
  }): Promise<ApiResponse<Product[]> & { aiPickId?: string }> {
    const response = await apiClient.get<
      ApiResponse<Product[]> & { aiPickId?: string }
    >('/products', { params });
    return response.data;
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product>>(
      `/products/${id}`,
    );
    return response.data;
  },

  async getPriceHistory(
    id: string,
  ): Promise<ApiResponse<Array<{ price: number; recordedAt: string }>>> {
    const response = await apiClient.get<
      ApiResponse<Array<{ price: number; recordedAt: string }>>
    >(`/products/${id}/price-history`);
    return response.data;
  },

  async getBuyAdvice(id: string): Promise<ApiResponse<{ advice: string }>> {
    const response = await apiClient.get<ApiResponse<{ advice: string }>>(
      `/products/${id}/buy-advice`,
    );
    return response.data;
  },

  async getBundleSuggestions(id: string): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/products/${id}/bundles`,
    );
    return response.data;
  },

  async getPersonalizedFeed(): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      '/products/feed/personalized',
    );
    return response.data;
  },

  async searchProducts(params: {
    q?: string;
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
  }): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/search', {
      params,
    });
    return response.data;
  },
};
