import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { BottomTabParamList } from './types';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { SearchScreen } from '../screens/Search/SearchScreen';
import { WishlistScreen } from '../screens/Wishlist/WishlistScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

interface TabItem {
    name: string;
    label: string;
    icon: string;
    iconOutline: string;
}

const TABS: TabItem[] = [
    { name: 'Home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
    { name: 'Search', label: 'Explore', icon: 'search', iconOutline: 'search-outline' },
    { name: 'Wishlist', label: 'Wishlist', icon: 'heart', iconOutline: 'heart-outline' },
    { name: 'Profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
];

const TabIcon = ({
    iconName,
    label,
    focused,
    onPress,
}: {
    iconName: string;
    label: string;
    focused: boolean;
    onPress: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: focused ? 1.1 : 1,
            useNativeDriver: true,
            tension: 130,
            friction: 8,
        }).start();
    }, [focused]);

    return (
        <TouchableWithoutFeedback onPress={onPress}>
            <Animated.View
                style={[
                    tabStyles.iconWrapper,
                    focused && tabStyles.iconWrapperActive,
                    { transform: [{ scale: scaleAnim }] },
                ]}>
                <Icon
                    name={iconName}
                    size={22}
                    color={focused ? Colors.white : Colors.textMuted}
                />
                <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
                    {label}
                </Text>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

// Custom Tab Bar component
const FloatingTabBar = ({ state, descriptors, navigation }: any) => {
    return (
        <View style={tabStyles.tabBarContainer}>
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                const tabData = TABS.find(t => t.name === route.name) || TABS[0];

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TabIcon
                        key={route.key}
                        iconName={isFocused ? tabData.icon : tabData.iconOutline}
                        label={tabData.label}
                        focused={isFocused}
                        onPress={onPress}
                    />
                );
            })}
        </View>
    );
};

export const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{
                headerShown: false,
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
                />
            ))}
        </Tab.Navigator>
    );
};

const tabStyles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 24,
        left: '8%',
        right: '8%',
        backgroundColor: Colors.primaryDark,
        borderRadius: BorderRadius.full,
        height: 68,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        ...Shadows.lg,
    },
    iconWrapper: {
        flex: 1,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xxl,
        gap: 3,
    },
    iconWrapperActive: {
        backgroundColor: Colors.primary,
    },
    label: {
        fontSize: 10,
        color: Colors.textMuted,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    labelActive: {
        color: Colors.white,
        fontWeight: '700',
    },
});
