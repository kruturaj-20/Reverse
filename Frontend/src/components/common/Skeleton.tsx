import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, BorderRadius } from '../../theme';

interface SkeletonProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: object;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius = BorderRadius.sm,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ]),
        );
        pulse.start();
        return () => pulse.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: Colors.surfaceElevated,
                    opacity,
                },
                style,
            ]}
        />
    );
};

export const ProductCardSkeleton = () => (
    <View style={skeletonStyles.card}>
        <Skeleton width="100%" height={160} borderRadius={12} />
        <View style={{ marginTop: 8, gap: 6 }}>
            <Skeleton width="60%" height={10} />
            <Skeleton width="100%" height={12} />
            <Skeleton width="40%" height={14} />
        </View>
    </View>
);

const skeletonStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: 12,
        flex: 1,
        margin: 6,
    },
});
