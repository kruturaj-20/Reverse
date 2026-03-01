import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    style,
    textStyle,
    fullWidth = false,
}) => {
    const sizeStyles = {
        sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, fontSize: Typography.sm },
        md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg, fontSize: Typography.base },
        lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, fontSize: Typography.md },
    };

    const s = sizeStyles[size];
    const isDisabled = disabled || loading;

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.85}
                style={[fullWidth && { width: '100%' }, style]}>
                <LinearGradient
                    colors={isDisabled ? ['#444', '#555'] : [Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.base, { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal }]}>
                    {loading ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                        <Text style={[styles.primaryText, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variantStyle =
        variant === 'secondary'
            ? styles.secondary
            : variant === 'ghost'
                ? styles.ghost
                : styles.danger;

    const variantTextStyle =
        variant === 'secondary'
            ? styles.secondaryText
            : variant === 'ghost'
                ? styles.ghostText
                : styles.dangerText;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.75}
            style={[
                styles.base,
                variantStyle,
                { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
                isDisabled && { opacity: 0.5 },
                fullWidth && { width: '100%' },
                style,
            ]}>
            {loading ? (
                <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
                <Text style={[variantTextStyle, { fontSize: s.fontSize }, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    secondary: {
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    danger: {
        backgroundColor: Colors.error + '22',
        borderWidth: 1,
        borderColor: Colors.error,
    },
    primaryText: {
        color: Colors.white,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    secondaryText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    ghostText: {
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    dangerText: {
        color: Colors.error,
        fontWeight: '600',
    },
});
