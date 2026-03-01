import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ResultsScreen } from '../screens/Results/ResultsScreen';
import { ProductDetailScreen } from '../screens/ProductDetail/ProductDetailScreen';
import { ImageSearchScreen } from '../screens/ImageSearch/ImageSearchScreen';
import { AuthNavigator } from './AuthNavigator';
import { Colors } from '../theme';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    const { user, restoreToken, isLoading } = useAuthStore();

    useEffect(() => {
        restoreToken();
    }, [restoreToken]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
            }}>
            {user ? (
                <>
                    <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
                    <Stack.Screen name="Results" component={ResultsScreen} />
                    <Stack.Screen
                        name="ProductDetail"
                        component={ProductDetailScreen}
                        options={{ animation: 'slide_from_bottom' }}
                    />
                    <Stack.Screen
                        name="ImageSearch"
                        component={ImageSearchScreen}
                        options={{ animation: 'slide_from_bottom' }}
                    />
                </>
            ) : (
                <Stack.Screen name="Auth" component={AuthNavigator as any} />
            )}
        </Stack.Navigator>
    );
};
