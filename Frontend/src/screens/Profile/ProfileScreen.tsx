import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const MENU_SECTIONS = [
    {
        title: 'Account',
        items: [
            { icon: '📦', label: 'My Orders', sub: '5 active orders' },
            { icon: '📍', label: 'Saved Addresses', sub: '2 saved' },
            { icon: '💳', label: 'Payment Methods', sub: 'UPI, Cards' },
        ],
    },
    {
        title: 'Preferences',
        items: [
            { icon: '🔔', label: 'Notifications', sub: 'Price alerts on' },
            { icon: '⚙️', label: 'Settings', sub: 'Language, currency' },
        ],
    },
    {
        title: 'Support',
        items: [
            { icon: '❓', label: 'Help & Support', sub: 'FAQs, chat' },
            { icon: '⭐', label: 'Rate the App', sub: 'Love us? Tell others!' },
            { icon: '📋', label: 'Privacy Policy', sub: '' },
        ],
    },
];

export const ProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await logout();
            // AppNavigator will handle redirection based on auth state
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView>
                {/* Gradient Header */}
                <LinearGradient
                    colors={[Colors.surface, Colors.background]}
                    style={styles.header}>
                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatar}>
                            <Text style={styles.avatarText}>RS</Text>
                        </LinearGradient>
                        {/* Online dot */}
                        <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'Sign in to access profile'}</Text>

                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
                    </TouchableOpacity>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        {[
                            { label: 'Saved', value: '12', icon: '❤️' },
                            { label: 'Orders', value: '5', icon: '📦' },
                            { label: 'Alerts', value: '8', icon: '🔔' },
                        ].map(stat => (
                            <View key={stat.label} style={styles.statCard}>
                                <Text style={styles.statIcon}>{stat.icon}</Text>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </LinearGradient>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* AI Usage Card */}
                <View style={styles.aiCard}>
                    <LinearGradient
                        colors={[Colors.primary + '22', Colors.accent + '11']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.aiGradient}>
                        <View style={styles.aiRow}>
                            <View>
                                <Text style={styles.aiTitle}>✨ AI Search Usage</Text>
                                <Text style={styles.aiText}>Free plan · 23 searches used</Text>
                            </View>
                            <TouchableOpacity style={styles.upgradeBtn}>
                                <Text style={styles.upgradeBtnText}>⚡ Upgrade</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '46%' }]} />
                        </View>
                        <Text style={styles.aiSub}>23 / 50 free searches this month</Text>
                    </LinearGradient>
                </View>

                {/* Menu Sections */}
                {MENU_SECTIONS.map(section => (
                    <View key={section.title} style={styles.menuSection}>
                        <Text style={styles.menuSectionTitle}>{section.title}</Text>
                        <View style={styles.menuCard}>
                            {section.items.map((item, i) => (
                                <TouchableOpacity
                                    key={item.label}
                                    style={[
                                        styles.menuRow,
                                        i > 0 && styles.menuRowBorder,
                                    ]}
                                    activeOpacity={0.7}>
                                    <View style={styles.menuIconWrap}>
                                        <Text style={styles.menuIcon}>{item.icon}</Text>
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={styles.menuLabel}>{item.label}</Text>
                                        {item.sub ? (
                                            <Text style={styles.menuSub}>{item.sub}</Text>
                                        ) : null}
                                    </View>
                                    <Text style={styles.chevron}>›</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout */}
                <View style={styles.menuSection}>
                    <View style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleLogout}>
                            <View style={[styles.menuIconWrap, styles.logoutIconWrap]}>
                                <Text style={styles.menuIcon}>🚪</Text>
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuLabel, styles.logoutLabel]}>Logout</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.version}>ReverseShop v1.0.0 · Made with ❤️ in India</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 110 },

    header: {
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: Spacing.xs,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.primary + '55',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    avatarText: { color: Colors.white, fontWeight: '900', fontSize: Typography.xxl },
    userName: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '800' },
    userEmail: { color: Colors.textMuted, fontSize: Typography.sm },
    editBtn: {
        backgroundColor: Colors.primaryGhost,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.base,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: Colors.primary + '44',
        marginTop: Spacing.xs,
    },
    editBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Typography.sm },

    statsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        width: '100%',
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.sm,
        alignItems: 'center',
        gap: 3,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    statIcon: { fontSize: 20 },
    statValue: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '800' },
    statLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '500' },

    aiCard: {
        marginHorizontal: Spacing.base,
        marginTop: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.primary + '33',
    },
    aiGradient: {
        padding: Spacing.base,
        gap: Spacing.xs,
    },
    aiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    aiTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '700' },
    aiText: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
    upgradeBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
    },
    upgradeBtnText: { color: Colors.white, fontWeight: '700', fontSize: Typography.sm },
    progressBar: {
        height: 5,
        backgroundColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
    },
    aiSub: { color: Colors.textMuted, fontSize: Typography.xs },

    menuSection: {
        marginHorizontal: Spacing.base,
        marginTop: Spacing.lg,
    },
    menuSectionTitle: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    menuCard: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    menuRowBorder: {
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    menuIconWrap: {
        width: 38,
        height: 38,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    logoutIconWrap: {
        backgroundColor: Colors.accent + '18',
        borderColor: Colors.accent + '44',
    },
    menuIcon: { fontSize: 18 },
    menuContent: { flex: 1 },
    menuLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '600' },
    menuSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
    logoutLabel: { color: Colors.accent },
    chevron: { color: Colors.textMuted, fontSize: Typography.xl, fontWeight: '300' },

    version: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
        textAlign: 'center',
        marginTop: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
});
