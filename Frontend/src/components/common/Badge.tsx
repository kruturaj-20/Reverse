import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type BadgeVariant = 'discount' | 'store' | 'new' | 'sponsored' | 'trending' | 'custom';

interface BadgeProps {
    variant?: BadgeVariant;
    label: string;
    color?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'custom', label, color }) => {
    const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
        discount: { bg: Colors.success + '22', text: Colors.success },
        store: { bg: Colors.primary + '22', text: Colors.primaryLight },
        new: { bg: Colors.info + '22', text: Colors.info },
        sponsored: { bg: Colors.warning + '22', text: Colors.warning },
        trending: { bg: Colors.accent + '22', text: Colors.accent },
        custom: { bg: (color ?? Colors.primary) + '22', text: color ?? Colors.primary },
    };

    const v = variantStyles[variant];

    return (
        <View style={[styles.container, { backgroundColor: v.bg }]}>
            <Text style={[styles.text, { color: v.text }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: Typography.xs,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
