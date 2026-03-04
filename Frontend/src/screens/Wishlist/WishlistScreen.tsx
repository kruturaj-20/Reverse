import React from 'react';
import {
    View,
    Text,
    FlatList,
    SectionList,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useWishlistStore } from '../../store/wishlistStore';
import { EmptyState } from '../../components/common/EmptyState';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const WishlistScreen = () => {
    const navigation = useNavigation<NavProp>();
    const { items: rawItems, groups, removeFromWishlist, loadWishlist, loading } = useWishlistStore();
    const items = rawItems || [];

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
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <SafeAreaView>
                <View style={styles.header}>
                    <View>
                        <View style={styles.titleRow}>
                            <Icon name="heart" size={22} color={Colors.error} style={styles.titleIcon} />
                            <Text style={styles.title}>Wishlist</Text>
                        </View>
                        <Text style={styles.subtitle}>
                            {items.length} item{items.length !== 1 ? 's' : ''} saved
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            {loading && items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>Loading wishlist...</Text>
                </View>
            ) : items.length === 0 ? (
                <EmptyState
                    icon="🤍"
                    title="Nothing saved yet"
                    description="Tap the heart on any product to save it here for later."
                    actionLabel="Explore Products"
                    onAction={() => navigation.navigate('MainTabs')}
                />
            ) : (
                (() => {
                    const sections = Object.entries(groups).map(([cat, arr]) => ({ title: cat, data: arr }));
                    if (sections.length > 0) {
                        return (
                            <SectionList
                                sections={sections}
                                keyExtractor={(item: any) => item.productId}
                                renderSectionHeader={({ section: { title } }) => (
                                    <Text style={styles.groupTitle}>{title.toUpperCase()}</Text>
                                )}
                                renderItem={({ item }: any) => {
                                    const product = items.find(p => p.id === item.productId);
                                    if (!product) return null;
                                    const storePrices = product.storePrices || [];
                                    const lowestPrice = storePrices.length > 0
                                        ? Math.min(...storePrices.map(s => s.price))
                                        : product.originalPrice;
                                    const savings = product.originalPrice - lowestPrice;
                                    const discountPct = Math.round(
                                        ((product.originalPrice - lowestPrice) / product.originalPrice) * 100,
                                    );
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                const isAffiliate = product.id.startsWith('amz_') || product.id.startsWith('fk_') || product.id.startsWith('af_');
                                                navigation.navigate('ProductDetail', {
                                                    productId: product.id,
                                                    product: isAffiliate ? product : undefined
                                                });
                                            }}
                                            activeOpacity={0.88}
                                            style={styles.card}>
                                            {/* image and content same as below snippet, reuse component? for now duplicate */}
                                            <View style={styles.imageWrap}>
                                                <Image
                                                    source={{ uri: product.image }}
                                                    style={styles.cardImage}
                                                    resizeMode="cover"
                                                />
                                                {discountPct > 0 && (
                                                    <View style={styles.discountBadge}>
                                                        <Text style={styles.discountText}>{discountPct}% OFF</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.cardContent}>
                                                <Text style={styles.cardBrand}>{product.brand}</Text>
                                                <Text style={styles.cardName} numberOfLines={2}>
                                                    {product.name}
                                                </Text>

                                                <View style={styles.priceRow}>
                                                    <Text style={styles.price}>
                                                        ₹{lowestPrice.toLocaleString()}
                                                    </Text>
                                                    <Text style={styles.original}>
                                                        ₹{product.originalPrice.toLocaleString()}
                                                    </Text>
                                                </View>
                                                {savings > 0 && (
                                                    <Text style={styles.savings}>
                                                        You save ₹{savings.toLocaleString()}
                                                    </Text>
                                                )}

                                                <View style={styles.cardFooter}>
                                                    <View style={styles.alertBadge}>
                                                        <Icon name="notifications-outline" size={11} color={Colors.warning} style={{ marginRight: 3 }} />
                                                        <Text style={styles.alertText}>Price Alert</Text>
                                                    </View>
                                                    <Text style={styles.storeCount}>
                                                        {storePrices.length} stores
                                                    </Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => confirmRemove(product.id, product.name)}
                                                style={styles.removeBtn}>
                                                <Icon name="close" size={18} color={Colors.textMuted} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    );
                                }}
                                ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                                contentContainerStyle={styles.list}
                            />
                        );
                    }
                    // fallback flat list
                    return (
                        <FlatList
                            data={items}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const storePrices = item.storePrices || [];
                                const lowestPrice = storePrices.length > 0
                                    ? Math.min(...storePrices.map(s => s.price))
                                    : item.originalPrice;
                                const savings = item.originalPrice - lowestPrice;
                                const discountPct = Math.round(
                                    ((item.originalPrice - lowestPrice) / item.originalPrice) * 100,
                                );

                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            const isAffiliate = item.id.startsWith('amz_') || item.id.startsWith('fk_') || item.id.startsWith('af_');
                                            navigation.navigate('ProductDetail', {
                                                productId: item.id,
                                                product: isAffiliate ? item : undefined
                                            });
                                        }}
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
                                            <Text style={styles.discountText}>{discountPct}% OFF</Text>
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
                                            You save ₹{savings.toLocaleString()}
                                        </Text>
                                    )}

                                    <View style={styles.cardFooter}>
                                        <View style={styles.alertBadge}>
                                            <Icon name="notifications-outline" size={11} color={Colors.warning} style={{ marginRight: 3 }} />
                                            <Text style={styles.alertText}>Price Alert</Text>
                                        </View>
                                        <Text style={styles.storeCount}>
                                            {storePrices.length} stores
                                        </Text>
                                    </View>
                                </View>

                                {/* Remove */}
                                <TouchableOpacity
                                    onPress={() => confirmRemove(item.id, item.name)}
                                    style={styles.removeBtn}>
                                    <Icon name="close" size={18} color={Colors.textMuted} />
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleIcon: {
        marginRight: Spacing.xs,
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
        marginLeft: 2,
    },

    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        paddingBottom: 80,
    },
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
        paddingBottom: 120,
        gap: Spacing.sm,
    },
    groupTitle: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing.xs,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        ...Shadows.sm,
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
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xs,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    discountText: {
        color: Colors.white,
        fontSize: 9,
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
        letterSpacing: 0.5,
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
        flexDirection: 'row',
        alignItems: 'center',
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
});
