import React, { useRef, useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Text,
    Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit?: () => void;
    onImagePress?: () => void;
    onMicPress?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    editable?: boolean;
    onPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    onSubmit,
    onImagePress,
    onMicPress,
    placeholder = 'Search products, brands, deals…',
    autoFocus = false,
    editable = true,
    onPress,
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    const borderAnim = useRef(new Animated.Value(0)).current;
    const [focused, setFocused] = useState(false);

    const handleFocus = () => {
        setFocused(true);
        Animated.parallel([
            Animated.spring(scale, { toValue: 1.02, useNativeDriver: true, tension: 120 }),
            Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        ]).start();
    };

    const handleBlur = () => {
        setFocused(false);
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120 }),
            Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.surfaceBorder, Colors.primary],
    });

    const elevation = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 10],
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.85 : 1}>
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{ scale }],
                        borderColor,
                        elevation,
                    },
                ]}>
                {/* Search icon */}
                <Text style={styles.searchIcon}>🔍</Text>

                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmit}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    autoFocus={autoFocus}
                    editable={editable && !onPress}
                    returnKeyType="search"
                    pointerEvents={onPress ? 'none' : 'auto'}
                />

                <View style={styles.actions}>
                    {onMicPress && (
                        <TouchableOpacity
                            onPress={onMicPress}
                            style={styles.actionBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                            <Text style={styles.actionIcon}>🎤</Text>
                        </TouchableOpacity>
                    )}
                    {onImagePress && (
                        <TouchableOpacity
                            onPress={onImagePress}
                            style={[styles.actionBtn, styles.cameraBtn]}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                            <Text style={styles.actionIcon}>📷</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.base,
        paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : 4,
        borderWidth: 1.5,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.textPrimary,
        paddingVertical: Spacing.sm,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    actionBtn: {
        padding: Spacing.xs,
    },
    actionIcon: {
        fontSize: 18,
    },
    cameraBtn: {
        backgroundColor: Colors.primaryGhost,
        borderRadius: BorderRadius.sm,
        padding: Spacing.xs + 1,
        borderWidth: 1,
        borderColor: Colors.primary + '33',
    },
});
