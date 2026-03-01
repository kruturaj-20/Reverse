import { apiClient } from './apiClient';
import { ApiResponse } from './types';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    createdAt: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export const authService = {
    async signup(data: any): Promise<ApiResponse<AuthResponse>> {
        const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data);
        return response.data;
    },

    async login(data: any): Promise<ApiResponse<AuthResponse>> {
        const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
        return response.data;
    },

    async logout(): Promise<void> {
        await apiClient.post('/auth/logout');
    },

    async getMe(): Promise<ApiResponse<User>> {
        const response = await apiClient.get<ApiResponse<User>>('/auth/me');
        return response.data;
    },
};
