import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';
import Config from 'react-native-config';

// ─── C2 Fix: Environment-driven API URL ──────────────────────────────────────
// API_BASE_URL is now read from `.env` via react-native-config.
// Change the value in .env for different environments (dev, staging, prod)
// without touching any source code.
//
// Fallback chain:
//   1. .env → Config.API_BASE_URL  (production-safe, per-env)
//   2. Platform-based default      (developer convenience when .env is missing)
const DEFAULT_BASE_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api/v1'
    : 'http://localhost:5000/api/v1';

export const API_BASE_URL: string = Config.API_BASE_URL ?? DEFAULT_BASE_URL;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor: Attach access token ────────────────────────────────
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

// ─── C4 Fix: Concurrent-401 Refresh Race Condition ───────────────────────────
// Problem: If two API calls both get a 401 simultaneously, both will try to
//          refresh the token. The second refresh call will fail (token already
//          rotated), triggering an unnecessary logout.
//
// Solution: A singleton promise. While a refresh is in-flight, all subsequent
//           401s await the SAME refresh promise instead of starting a new one.
//           Once resolved, all queued requests retry with the new token.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/** Notify all queued requests that a new token is available */
function onTokenRefreshed(newToken: string) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
}

/** Queue a callback to be called once the in-flight refresh completes */
function addRefreshSubscriber(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

// ─── Response Interceptor: Handle 401s and token refresh ─────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh logic for auth endpoints to prevent infinite loops
        const isAuthEndpoint =
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/signup') ||
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/logout');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // ── Another refresh is already in-flight. Queue this request ──
                return new Promise<string>((resolve) => {
                    addRefreshSubscriber((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const { refreshToken: getRefreshToken, setTokens, logout } = useAuthStore.getState();
                const currentRefreshToken = getRefreshToken();

                if (!currentRefreshToken) {
                    isRefreshing = false;
                    await logout();
                    return Promise.reject(error);
                }

                // Use a bare axios call (not apiClient) to avoid interceptor loops
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken: currentRefreshToken,
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

                // Persist new tokens
                setTokens(newAccessToken, newRefreshToken);

                // Notify all queued requests
                onTokenRefreshed(newAccessToken);

                // Retry the original failed request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh itself failed — log out the user
                refreshSubscribers = []; // Clear queue
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Standardize error messages from our backend response envelope
        const apiError = error.response?.data?.error || error.message;
        return Promise.reject(new Error(apiError));
    }
);
