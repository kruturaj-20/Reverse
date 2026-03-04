import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Product } from '../data/mockProducts';
// Auth Stack
export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
};

// Root Stack
export type RootStackParamList = {
    Auth: undefined;
    MainTabs: undefined;
    Results: { query?: string; category?: string; imageUri?: string };
    // 'product' is optional — affiliate products pass the full object to avoid
    // a second API call that would return a stub on cache miss.
    // DB products only pass productId and fetch normally.
    ProductDetail: { productId: string; product?: Product };
    ImageSearch: undefined;
    InAppBrowser: { url: string; title?: string };
};

// Bottom Tabs
export type BottomTabParamList = {
    Home: undefined;
    Search: undefined;
    Wishlist: undefined;
    Profile: undefined;
};

// Navigation prop types
export type RootStackNavProp = NativeStackNavigationProp<RootStackParamList>;
export type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
