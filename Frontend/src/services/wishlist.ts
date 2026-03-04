import { apiClient } from './apiClient';
import { ApiResponse } from './types';
import { Product } from '../data/mockProducts';

// Wishlist Responses
export interface WishlistResponse {
  userId: string;
  productId: string;
  targetPrice?: number;
  notifiedAt?: string;
  createdAt: string;
}

export interface WishlistWithProductsResponse {
  wishlist: WishlistResponse[];
  products: Product[];
  groups?: Record<string, WishlistResponse[]>; // categorized by category name
}

export const wishlistService = {
  // Get all wishlist items including populated products
  async getWishlist(): Promise<ApiResponse<WishlistWithProductsResponse>> {
    const response = await apiClient.get<
      ApiResponse<WishlistWithProductsResponse>
    >('/wishlist');
    return response.data;
  },

  // Add item to wishlist
  async addToWishlist(
    productId: string,
    targetPrice?: number,
  ): Promise<ApiResponse<WishlistResponse>> {
    const payload: any = { productId: String(productId) };
    // only include valid non-negative numbers
    if (
      typeof targetPrice === 'number' &&
      !isNaN(targetPrice) &&
      targetPrice >= 0
    ) {
      payload.targetPrice = targetPrice;
    }
    console.debug('[wishlistService] payload', payload);
    const response = await apiClient.post<ApiResponse<WishlistResponse>>(
      '/wishlist',
      payload,
    );
    return response.data;
  },

  // Remove item from wishlist
  async updateTargetPrice(
    productId: string,
    targetPrice: number,
  ): Promise<ApiResponse<WishlistResponse>> {
    const response = await apiClient.patch<ApiResponse<WishlistResponse>>(
      `/wishlist/${productId}/target`,
      { targetPrice },
    );
    return response.data;
  },

  async removeFromWishlist(productId: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/wishlist/${productId}`,
    );
    return response.data;
  },
};
