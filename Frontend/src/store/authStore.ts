import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, authService } from '../services/auth';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isSignout: boolean;
    error: string | null;

    // Actions
    login: (data: any) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    restoreToken: () => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    refreshToken: () => string | null;
}

const ACCESS_TOKEN_KEY = '@reverseshop_access_token';
const REFRESH_TOKEN_KEY = '@reverseshop_refresh_token';

let memoryRefreshToken: string | null = null; // Don't expose this in state directly if possible

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isLoading: true, // Start loading as we check for stored tokens
    isSignout: false,
    error: null,

    setTokens: (accessToken, refreshToken) => {
        set({ accessToken });
        memoryRefreshToken = refreshToken;
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken).catch(console.error);
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken).catch(console.error);
    },

    refreshToken: () => memoryRefreshToken,

    login: async (data: any) => {
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

    signup: async (data: any) => {
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
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        // Only call the API if we actually had a token — avoids 401 when
        // logout is triggered by the response interceptor (token already gone)
        if (currentToken) {
            await authService.logout().catch(() => { }); // Ignore network errors
        }
    },

    restoreToken: async () => {
        try {
            const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

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
        } catch (e) {
            // Token restoring failed, proceed with signed out state
        } finally {
            set({ isLoading: false });
        }
    },
}));
