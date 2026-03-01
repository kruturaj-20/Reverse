import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useWishlistStore } from '../../store/wishlistStore';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const WishlistScreen = () => {
    const navigation = useNavigation<NavProp>();
    const { items, removeFromWishlist, loadWishlist, loading } = useWishlistStore();

    React.useEffect(() => {
        loadWishlist();
    }, []);

    const confirmRemove = (id: string, name: string) => {
        Alert.alert('Remove from Wishlist', `Remove "${name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeFromWishlist(id) },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>❤️ Wishlist</Text>
                        <Text style={styles.subtitle}>
                            {items.length} item{items.length !== 1 ? 's' : ''} saved
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            {items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🤍</Text>
                    <Text style={styles.emptyTitle}>Nothing saved yet</Text>
                    <Text style={styles.emptyText}>
                        Tap the ❤️ on any product to save it here
                    </Text>
                    <TouchableOpacity
                        style={styles.browseBtn}
                        onPress={() => navigation.navigate('MainTabs')}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.browseBtnGrad}>
                            <Text style={styles.browseBtnText}>Browse Products</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : loading && items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>Loading wishlist...</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const lowestPrice = Math.min(...item.storePrices.map(s => s.price));
                        const savings = item.originalPrice - lowestPrice;
                        const discountPct = Math.round(
                            ((item.originalPrice - lowestPrice) / item.originalPrice) * 100,
                        );

                        return (
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate('ProductDetail', { productId: item.id })
                                }
                                activeOpacity={0.88}
                                style={styles.card}>
                                {/* Image */}
                                <View style={styles.imageWrap}>
                                    <Image
                                        source={{ uri: item.image }}
                                        style={styles.cardImage}
                                        resizeMode="cover"
                                    />
                                    {discountPct > 0 && (
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountText}>{discountPct}%</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Content */}
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardBrand}>{item.brand}</Text>
                                    <Text style={styles.cardName} numberOfLines={2}>
                                        {item.name}
                                    </Text>

                                    <View style={styles.priceRow}>
                                        <Text style={styles.price}>
                                            ₹{lowestPrice.toLocaleString()}
                                        </Text>
                                        <Text style={styles.original}>
                                            ₹{item.originalPrice.toLocaleString()}
                                        </Text>
                                    </View>
                                    {savings > 0 && (
                                        <Text style={styles.savings}>
                                            You save ₹{savings.toLocaleString()} 🎉
                                        </Text>
                                    )}

                                    <View style={styles.cardFooter}>
                                        <View style={styles.alertBadge}>
                                            <Text style={styles.alertText}>
                                                🔔 Price Alert
                                            </Text>
                                        </View>
                                        <Text style={styles.storeCount}>
                                            {item.storePrices.length} stores
                                        </Text>
                                    </View>
                                </View>

                                {/* Remove */}
                                <TouchableOpacity
                                    onPress={() => confirmRemove(item.id, item.name)}
                                    style={styles.removeBtn}>
                                    <Text style={styles.removeIcon}>✕</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: Typography.xxl,
        fontWeight: '800',
    },
    subtitle: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
        marginTop: 2,
    },

    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        paddingBottom: 80,
    },
    emptyIcon: { fontSize: 72 },
    emptyTitle: {
        color: Colors.textPrimary,
        fontSize: Typography.xl,
        fontWeight: '700',
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: Typography.base,
        textAlign: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    browseBtn: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        marginTop: Spacing.sm,
    },
    browseBtnGrad: {
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    browseBtnText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: Typography.base,
    },

    list: {
        padding: Spacing.base,
        paddingBottom: 110,
        gap: Spacing.sm,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    imageWrap: {
        position: 'relative',
    },
    cardImage: {
        width: 110,
        height: 140,
    },
    discountBadge: {
        position: 'absolute',
        top: Spacing.xs,
        left: Spacing.xs,
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.xs,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    discountText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '800',
    },
    cardContent: {
        flex: 1,
        padding: Spacing.sm,
        gap: 4,
        justifyContent: 'center',
    },
    cardBrand: {
        color: Colors.primary,
        fontSize: Typography.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardName: {
        color: Colors.textPrimary,
        fontSize: Typography.sm,
        fontWeight: '600',
        lineHeight: 18,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.xs,
    },
    price: {
        color: Colors.textPrimary,
        fontSize: Typography.lg,
        fontWeight: '800',
    },
    original: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
        textDecorationLine: 'line-through',
    },
    savings: {
        color: Colors.success,
        fontSize: Typography.xs,
        fontWeight: '700',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 2,
    },
    alertBadge: {
        backgroundColor: Colors.warning + '22',
        borderRadius: BorderRadius.xs,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    alertText: {
        color: Colors.warning,
        fontSize: Typography.xs,
        fontWeight: '600',
    },
    storeCount: { color: Colors.textMuted, fontSize: Typography.xs },

    removeBtn: {
        padding: Spacing.sm,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: Spacing.md,
    },
    removeIcon: {
        color: Colors.textMuted,
        fontSize: Typography.base,
    },
});
