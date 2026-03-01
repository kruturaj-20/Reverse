import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from './types';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { SearchScreen } from '../screens/Search/SearchScreen';
import { WishlistScreen } from '../screens/Wishlist/WishlistScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TABS = [
    { name: 'Home', icon: '🏠', label: 'Home' },
    { name: 'Search', icon: '🔎', label: 'Explore' },
    { name: 'Wishlist', icon: '❤️', label: 'Wishlist' },
    { name: 'Profile', icon: '👤', label: 'Profile' },
];

const TabIcon = ({
    icon,
    label,
    focused,
}: {
    icon: string;
    label: string;
    focused: boolean;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bgAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: focused ? 1.15 : 1,
                useNativeDriver: true,
                tension: 120,
                friction: 7,
            }),
            Animated.timing(bgAnim, {
                toValue: focused ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    }, [focused]);

    const bgColor = bgAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', Colors.primary + '28'],
    });

    return (
        <Animated.View style={[tabStyles.iconWrapper, { backgroundColor: bgColor }]}>
            <Animated.Text
                style={[tabStyles.iconText, { transform: [{ scale: scaleAnim }] }]}>
                {icon}
            </Animated.Text>
        </Animated.View>
    );
};

export const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: tabStyles.tabBar,
                tabBarLabelStyle: tabStyles.label,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarItemStyle: tabStyles.tabItem,
            }}>
            {TABS.map(tab => (
                <Tab.Screen
                    key={tab.name}
                    name={tab.name as any}
                    component={
                        tab.name === 'Home'
                            ? HomeScreen
                            : tab.name === 'Search'
                                ? SearchScreen
                                : tab.name === 'Wishlist'
                                    ? WishlistScreen
                                    : ProfileScreen
                    }
                    options={{
                        tabBarLabel: tab.label,
                        tabBarIcon: ({ focused }) => (
                            <TabIcon icon={tab.icon} label={tab.label} focused={focused} />
                        ),
                    }}
                />
            ))}
        </Tab.Navigator>
    );
};

const tabStyles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 12,
        left: 16,
        right: 16,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        height: 68,
        paddingBottom: 6,
        paddingTop: 6,
        elevation: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    tabItem: {
        borderRadius: BorderRadius.xxl,
    },
    label: {
        fontSize: Typography.xs,
        fontWeight: '600',
        marginTop: 2,
    },
    iconWrapper: {
        width: 44,
        height: 30,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 19,
    },
});
