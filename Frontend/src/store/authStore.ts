import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import { User, authService, LoginPayload, SignupPayload } from '../services/auth';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isSignout: boolean;
    error: string | null;

    // Actions
    login: (data: LoginPayload) => Promise<void>;
    signup: (data: SignupPayload) => Promise<void>;
    logout: () => Promise<void>;
    restoreToken: () => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    refreshToken: () => string | null;
}

// Access token (15 min lifetime) — AsyncStorage is fine for short-lived tokens.
const ACCESS_TOKEN_KEY = '@reverseshop_access_token';
// Refresh token (30 day lifetime) — MUST be stored encrypted.
const REFRESH_TOKEN_KEY = 'reverseshop_refresh_token';

let memoryRefreshToken: string | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isLoading: true,
    isSignout: false,
    error: null,

    setTokens: (accessToken, refreshToken) => {
        set({ accessToken });
        memoryRefreshToken = refreshToken;
        // Access token in AsyncStorage (short-lived — 15 min)
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken).catch(console.error);
        // Refresh token in EncryptedStorage (long-lived — 30 days; hardware-backed on Android)
        EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken).catch(console.error);
    },

    refreshToken: () => memoryRefreshToken,

    login: async (data: LoginPayload) => {
        try {
            set({ isLoading: true, error: null });
            const response = await authService.login(data);
            if (response.success && response.data) {
                const { user, accessToken, refreshToken } = response.data;
                get().setTokens(accessToken, refreshToken);
                set({ user, isSignout: false });
            }
        } catch (error: any) {
            set({ error: error.message || 'Login failed' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    signup: async (data: SignupPayload) => {
        try {
            set({ isLoading: true, error: null });
            const response = await authService.signup(data);
            if (response.success && response.data) {
                const { user, accessToken, refreshToken } = response.data;
                get().setTokens(accessToken, refreshToken);
                set({ user, isSignout: false });
            }
        } catch (error: any) {
            set({ error: error.message || 'Signup failed' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        const currentToken = get().accessToken;
        // Clear state immediately to prevent re-entry from interceptors
        set({ user: null, accessToken: null, isSignout: true });
        memoryRefreshToken = null;
        // Clear both storages
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
        await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => { });
        // Only call the API if we actually had a token — avoids 401 when
        // logout is triggered by the response interceptor (token already gone)
        if (currentToken) {
            await authService.logout().catch(() => { }); // Ignore network errors
        }
    },

    restoreToken: async () => {
        try {
            const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
            const refreshToken = await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);

            if (accessToken && refreshToken) {
                memoryRefreshToken = refreshToken;
                set({ accessToken });

                // Fetch current user details since we have a token
                const response = await authService.getMe();
                if (response.success) {
                    set({ user: response.data, isSignout: false });
                } else {
                    // If token fails, clear it
                    await get().logout();
                }
            }
        } catch (_e) {
            // Token restoring failed — proceed with signed out state
        } finally {
            set({ isLoading: false });
        }
    },
}));
