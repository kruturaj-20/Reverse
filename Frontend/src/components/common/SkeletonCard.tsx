import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../theme';

interface SkeletonCardProps {
    width?: number | string;
    height?: number;
}

const SkeletonBox = ({
    width,
    height,
    borderRadius = 8,
    opacity,
}: {
    width: number | string;
    height: number;
    borderRadius?: number;
    opacity: Animated.AnimatedInterpolation<string | number>;
}) => (
    <Animated.View
        style={[
            styles.shimmer,
            { width: width as any, height, borderRadius, opacity },
        ]}
    />
);

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    width = '100%',
    height = 280,
}) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, []);

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={[styles.card, { width: width as any }]}>
            {/* Image placeholder */}
            <SkeletonBox
                width="100%"
                height={height * 0.55}
                borderRadius={BorderRadius.lg}
                opacity={opacity}
            />
            <View style={styles.body}>
                <SkeletonBox width="40%" height={10} opacity={opacity} />
                <SkeletonBox width="85%" height={12} opacity={opacity} />
                <SkeletonBox width="65%" height={12} opacity={opacity} />
                <SkeletonBox width="50%" height={16} opacity={opacity} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    shimmer: {
        backgroundColor: Colors.surfaceBorder,
    },
    body: {
        padding: Spacing.sm,
        gap: Spacing.xs,
    },
});
