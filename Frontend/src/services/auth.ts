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

export interface LoginPayload {
    email: string;
    password: string;
}

export interface SignupPayload {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const authService = {
    async signup(data: SignupPayload): Promise<ApiResponse<AuthResponse>> {
        const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data);
        return response.data;
    },

    async login(data: LoginPayload): Promise<ApiResponse<AuthResponse>> {
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
