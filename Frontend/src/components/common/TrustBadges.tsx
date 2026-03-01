import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

interface TrustBadgesProps {
    compact?: boolean; // shows 2 items instead of all 4
}

const BADGES = [
    { icon: '✔', label: 'Verified Seller' },
    { icon: '✔', label: 'Secure Payment' },
    { icon: '✔', label: '7-Day Return' },
    { icon: '✔', label: 'Fast Delivery' },
];

export const TrustBadges: React.FC<TrustBadgesProps> = ({ compact = false }) => {
    const items = compact ? BADGES.slice(0, 2) : BADGES;

    return (
        <View style={[styles.container, compact && styles.compactContainer]}>
            {items.map((b, i) => (
                <View key={i} style={styles.badge}>
                    <Text style={styles.check}>{b.icon}</Text>
                    <Text style={[styles.label, compact && styles.compactLabel]}>
                        {compact ? b.label.split(' ')[0] : b.label}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    compactContainer: {
        gap: Spacing.xs,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    check: {
        color: Colors.success,
        fontSize: Typography.xs,
        fontWeight: '800',
    },
    label: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
    },
    compactLabel: {
        fontSize: 10,
        color: Colors.textMuted,
    },
});
