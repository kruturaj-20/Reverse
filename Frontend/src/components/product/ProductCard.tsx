import React, { useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Pressable,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { Product } from '../../data/mockProducts';
import { useWishlistStore } from '../../store/wishlistStore';
import { Badge } from '../common/Badge';
import { TrustBadges } from '../common/TrustBadges';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    style?: object;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
    const inWishlist = isInWishlist(product.id);
    const scale = useRef(new Animated.Value(1)).current;
    const heartScale = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    const toggleWishlist = () => {
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.6, useNativeDriver: true, tension: 200 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 200 }),
        ]).start();
        if (inWishlist) removeFromWishlist(product.id);
        else addToWishlist(product);
    };

    const lowestPrice = Math.min(...product.storePrices.map(s => s.price));
    const discountPct = Math.round(((product.originalPrice - lowestPrice) / product.originalPrice) * 100);

    return (
        <Animated.View style={[styles.card, style, { transform: [{ scale }] }]}>
            <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />

                    {/* Overlay badges */}
                    <View style={styles.topBadges}>
                        {product.isSponsored && <Badge variant="sponsored" label="Ad" />}
                        {product.isTrending && <Badge variant="trending" label="🔥 Hot" />}
                    </View>

                    {/* Wishlist */}
                    <TouchableOpacity
                        onPress={toggleWishlist}
                        style={styles.wishlistBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Animated.Text style={[styles.heartIcon, { transform: [{ scale: heartScale }] }]}>
                            {inWishlist ? '❤️' : '🤍'}
                        </Animated.Text>
                    </TouchableOpacity>

                    {/* Discount */}
                    {discountPct > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discountPct}% OFF</Text>
                        </View>
                    )}
                </View>

                {/* Details */}
                <View style={styles.details}>
                    <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
                    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

                    {/* Rating */}
                    <View style={styles.ratingRow}>
                        <Text style={styles.star}>⭐</Text>
                        <Text style={styles.rating}>{product.rating}</Text>
                        <Text style={styles.reviews}>({product.reviews.toLocaleString()})</Text>
                    </View>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{lowestPrice.toLocaleString()}</Text>
                        <Text style={styles.originalPrice}>₹{product.originalPrice.toLocaleString()}</Text>
                    </View>

                    {/* Delivery */}
                    <Text style={styles.delivery}>🚚 Free Delivery</Text>

                    {/* Trust */}
                    <TrustBadges compact />

                    {/* Add to cart */}
                    <TouchableOpacity style={styles.addBtn} onPress={onPress}>
                        <Text style={styles.addBtnText}>+ Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.primary + '22',
        ...Shadows.sm,
    },
    imageContainer: {
        position: 'relative',
        height: 175,
        backgroundColor: Colors.surfaceElevated,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    topBadges: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        gap: 4,
    },
    wishlistBtn: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: 'rgba(15,15,26,0.65)',
        borderRadius: BorderRadius.full,
        padding: 5,
    },
    heartIcon: {
        fontSize: 16,
    },
    discountBadge: {
        position: 'absolute',
        bottom: Spacing.sm,
        left: Spacing.sm,
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.xs,
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
    },
    discountText: {
        color: Colors.white,
        fontSize: Typography.xs,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    details: {
        padding: Spacing.sm,
        gap: 3,
    },
    brand: {
        fontSize: Typography.xs,
        color: Colors.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    name: {
        fontSize: Typography.sm,
        color: Colors.textPrimary,
        fontWeight: '500',
        lineHeight: 18,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 2,
    },
    star: { fontSize: 10 },
    rating: {
        fontSize: Typography.xs,
        color: Colors.gold,
        fontWeight: '700',
    },
    reviews: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginTop: 2,
    },
    price: {
        fontSize: Typography.md,
        color: Colors.textPrimary,
        fontWeight: '800',
    },
    originalPrice: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
        textDecorationLine: 'line-through',
    },
    delivery: {
        fontSize: Typography.xs,
        color: Colors.success,
        fontWeight: '600',
        marginTop: 1,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingVertical: 6,
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    addBtnText: {
        color: Colors.white,
        fontSize: Typography.xs,
        fontWeight: '700',
    },
});
