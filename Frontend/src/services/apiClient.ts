import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator to hit localhost, or standard localhost for iOS simulator
export const API_BASE_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api/v1'
    : 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Skip refresh logic for auth endpoints to prevent infinite loops
            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/signup') ||
                originalRequest.url?.includes('/auth/refresh') ||
                originalRequest.url?.includes('/auth/logout')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                const { refreshToken: getRefreshToken, setTokens, logout } = useAuthStore.getState();
                const currentRefreshToken = getRefreshToken();

                if (!currentRefreshToken) {
                    logout();
                    return Promise.reject(error);
                }

                // Call refresh endpoint directly using axios to avoid circular interceptor loops
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken: currentRefreshToken,
                });

                const { accessToken, refreshToken } = response.data.data;

                // Save new tokens
                setTokens(accessToken, refreshToken);

                // Update original request with new token and retry
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, log the user out
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        // Standardize error responses from our backend
        const apiError = error.response?.data?.error || error.message;
        return Promise.reject(new Error(apiError));
    }
);
