import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface AppHeaderProps {
    cartCount?: number;
    location?: string;
    onCartPress?: () => void;
    onAvatarPress?: () => void;
    onLocationPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    cartCount = 0,
    location = 'Mumbai',
    onCartPress,
    onAvatarPress,
    onLocationPress,
}) => {
    return (
        <View style={styles.wrapper}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.headerBg} />
            <SafeAreaView>
                <View style={styles.row}>
                    {/* Logo */}
                    <View style={styles.logoBlock}>
                        <View style={styles.logoIconWrap}>
                            <LinearGradient
                                colors={[Colors.primary, Colors.accent]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.logoIcon}>
                                <Text style={styles.logoIconText}>R</Text>
                            </LinearGradient>
                        </View>
                        <View>
                            <Text style={styles.logoText}>ReverseShop</Text>
                            <TouchableOpacity
                                onPress={onLocationPress}
                                style={styles.locationRow}>
                                <Text style={styles.locationPin}>📍</Text>
                                <Text style={styles.locationText}>Deliver to </Text>
                                <Text style={styles.locationCity}>{location}</Text>
                                <Text style={styles.locationChevron}>⌄</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Right Actions */}
                    <View style={styles.actions}>
                        {/* Cart */}
                        <TouchableOpacity
                            onPress={onCartPress}
                            style={styles.actionBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={styles.actionIcon}>🛒</Text>
                            {cartCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Avatar */}
                        <TouchableOpacity onPress={onAvatarPress} style={styles.avatar}>
                            <LinearGradient
                                colors={[Colors.primary, Colors.accent]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.avatarGradient}>
                                <Text style={styles.avatarText}>RS</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
            {/* Bottom divider */}
            <View style={styles.divider} />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: Colors.headerBg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    logoBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    logoIconWrap: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    logoIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoIconText: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: Typography.lg,
    },
    logoText: {
        color: Colors.textPrimary,
        fontSize: Typography.md,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 1,
    },
    locationPin: {
        fontSize: 10,
    },
    locationText: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
    },
    locationCity: {
        color: Colors.primary,
        fontSize: Typography.xs,
        fontWeight: '700',
    },
    locationChevron: {
        color: Colors.primary,
        fontSize: 10,
        marginLeft: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    actionBtn: {
        position: 'relative',
        padding: Spacing.xs,
    },
    actionIcon: {
        fontSize: 22,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.full,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.headerBg,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 8,
        fontWeight: '800',
    },
    avatar: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.primary + '55',
    },
    avatarGradient: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.white,
        fontWeight: '800',
        fontSize: Typography.xs,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceBorder,
    },
});
