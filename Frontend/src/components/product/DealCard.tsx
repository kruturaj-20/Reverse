import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
    Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Product } from '../../data/mockProducts';
import { useWishlistStore } from '../../store/wishlistStore';

interface DealCardProps {
    product: Product;
    onPress: () => void;
}

export const DealCard: React.FC<DealCardProps> = ({ product, onPress }) => {
    const lowestPrice = Math.min(...product.storePrices.map(s => s.price));
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
    const inWishlist = isInWishlist(product.id);
    const heartScale = useRef(new Animated.Value(1)).current;
    const cardScale = useRef(new Animated.Value(1)).current;

    const toggleWishlist = () => {
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.5, useNativeDriver: true, tension: 200 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 200 }),
        ]).start();
        if (inWishlist) removeFromWishlist(product.id);
        else addToWishlist(product);
    };

    const onPressIn = () => Animated.spring(cardScale, { toValue: 0.96, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(cardScale, { toValue: 1, useNativeDriver: true }).start();

    // Build star display
    const fullStars = Math.floor(product.rating);
    const stars = '⭐'.repeat(fullStars) + (product.rating % 1 >= 0.5 ? '✨' : '');

    return (
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
            <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
                <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />

                {/* Gradient overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(15,15,26,0.85)', '#0F0F1A']}
                    style={styles.gradient}
                />

                {/* Discount pill — top right */}
                <View style={styles.discountPill}>
                    <Text style={styles.discountText}>{product.discount}% OFF</Text>
                </View>

                {/* Wishlist — top left */}
                <TouchableOpacity onPress={toggleWishlist} style={styles.wishlistBtn}>
                    <Animated.Text style={[styles.heartIcon, { transform: [{ scale: heartScale }] }]}>
                        {inWishlist ? '❤️' : '🤍'}
                    </Animated.Text>
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.brand}>{product.brand}</Text>
                    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

                    {/* Rating */}
                    <View style={styles.ratingRow}>
                        <Text style={styles.stars}>{stars}</Text>
                        <Text style={styles.ratingVal}> {product.rating}</Text>
                        <Text style={styles.ratingCount}> ({product.reviews.toLocaleString()})</Text>
                    </View>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{lowestPrice.toLocaleString()}</Text>
                        <Text style={styles.originalPrice}>₹{product.originalPrice.toLocaleString()}</Text>
                    </View>

                    {/* Delivery + Cart button */}
                    <View style={styles.bottomRow}>
                        <Text style={styles.delivery}>🚚 Free delivery</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={onPress}>
                            <Text style={styles.addBtnText}>+ Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 220,
        height: 300,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginRight: Spacing.base,
        position: 'relative',
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        ...Shadows.md,
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 185,
    },
    discountPill: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
    },
    discountText: {
        color: Colors.white,
        fontSize: Typography.xs,
        fontWeight: '800',
    },
    wishlistBtn: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        backgroundColor: 'rgba(15,15,26,0.6)',
        borderRadius: BorderRadius.full,
        padding: 6,
    },
    heartIcon: {
        fontSize: 16,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.md,
        gap: 3,
    },
    brand: {
        fontSize: Typography.xs,
        color: Colors.primaryLight,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    name: {
        fontSize: Typography.sm,
        color: Colors.white,
        fontWeight: '600',
        lineHeight: 18,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    stars: {
        fontSize: 9,
    },
    ratingVal: {
        fontSize: Typography.xs,
        color: Colors.gold,
        fontWeight: '700',
    },
    ratingCount: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginTop: 2,
    },
    price: {
        fontSize: Typography.lg,
        color: Colors.white,
        fontWeight: '800',
    },
    originalPrice: {
        fontSize: Typography.xs,
        color: Colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 3,
    },
    delivery: {
        fontSize: Typography.xs,
        color: Colors.success,
        fontWeight: '600',
    },
    addBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    addBtnText: {
        color: Colors.white,
        fontSize: Typography.xs,
        fontWeight: '700',
    },
});
