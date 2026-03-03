import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface HomeHeaderProps {
    location?: string;
    onLocationPress?: () => void;
    onNotificationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    location = 'New York, USA',
    onLocationPress,
    onNotificationPress,
}) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <View style={styles.container}>
                <View style={styles.locationContainer}>
                    <Text style={styles.label}>Deliver to</Text>
                    <TouchableOpacity style={styles.locationRow} onPress={onLocationPress}>
                        <Icon name="location" size={14} color={Colors.primary} style={styles.pinIcon} />
                        <Text style={styles.locationText}>{location}</Text>
                        <Icon name="chevron-down-outline" size={14} color={Colors.textSecondary} style={styles.chevronIcon} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.notificationBtn} onPress={onNotificationPress}>
                    <Icon name="notifications-outline" size={20} color={Colors.textPrimary} />
                    <View style={styles.badge} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Colors.background,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    locationContainer: {
        flex: 1,
    },
    label: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
        fontWeight: '500',
        marginBottom: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pinIcon: {
        marginRight: 4,
    },
    locationText: {
        color: Colors.textPrimary,
        fontSize: Typography.md,
        fontWeight: '700',
    },
    chevronIcon: {
        marginLeft: 4,
    },
    notificationBtn: {
        width: 42,
        height: 42,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.accentLight,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    badge: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
        borderWidth: 1.5,
        borderColor: Colors.background,
    },
});
