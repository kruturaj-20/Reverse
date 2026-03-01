import { apiClient } from './apiClient';
import { ApiResponse } from './types';
import { CartItem } from './cart';

export interface OrderAddress {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface OrderResponse {
    id: string;
    userId: string;
    items: CartItem[];
    totalAmount: number;
    shippingAddress: OrderAddress;
    paymentStatus: 'pending' | 'completed' | 'failed';
    orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: string;
}

export const orderService = {
    // Checkout endpoint
    async checkout(shippingAddress: OrderAddress): Promise<ApiResponse<OrderResponse>> {
        const response = await apiClient.post<ApiResponse<OrderResponse>>('/orders/checkout', { shippingAddress });
        return response.data;
    },

    // Get user order history
    async getMyOrders(): Promise<ApiResponse<OrderResponse[]>> {
        const response = await apiClient.get<ApiResponse<OrderResponse[]>>('/orders');
        return response.data;
    },

    // Get specific order details
    async getOrderById(orderId: string): Promise<ApiResponse<OrderResponse>> {
        const response = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/${orderId}`);
        return response.data;
    }
};
