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
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    orderStatus: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    createdAt: string;
}

export interface RazorpayCheckoutInfo {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
}

export interface CheckoutResponse {
    order: OrderResponse;
    razorpay: RazorpayCheckoutInfo;
}

export const orderService = {
    // Checkout endpoint
    async checkout(shippingAddress: OrderAddress): Promise<ApiResponse<CheckoutResponse>> {
        const response = await apiClient.post<ApiResponse<CheckoutResponse>>('/orders/checkout', { shippingAddress });
        return response.data;
    },

    async verifyPayment(orderId: string, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string): Promise<ApiResponse<OrderResponse>> {
        const payload = { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature };
        const response = await apiClient.post<ApiResponse<OrderResponse>>('/orders/verify', payload);
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
