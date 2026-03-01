import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { SearchBar } from '../../components/common/SearchBar';
import { AppHeader } from '../../components/common/AppHeader';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { DealCard } from '../../components/product/DealCard';
import { ProductCard } from '../../components/product/ProductCard';
import { mockCategories } from '../../data/mockCategories';
import { Product } from '../../data/mockProducts';
import { productService } from '../../services/products';
import { useCartStore } from '../../store/cartStore';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
    const navigation = useNavigation<NavProp>();
    const { getCartCount, loadCart } = useCartStore();

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [trending, setTrending] = useState<Product[]>([]);

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Fetch normal products
            const categoryFilter = selectedCategory === 'all' ? undefined : selectedCategory;
            const res = await productService.getProducts({ category: categoryFilter, limit: 12 });
            setProducts(res.data);

            // Fetch trending (highest rated) only once
            if (trending.length === 0) {
                const trendingRes = await productService.getProducts({ sort: 'rating', limit: 5 });
                setTrending(trendingRes.data);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader
                cartCount={getCartCount()}
                location="Mumbai"
                onCartPress={() => { /* Navigate to cart later */ }}
                onAvatarPress={() => navigation.navigate('MainTabs')}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}>

                {/* Smart Search Bar */}
                <View style={styles.searchSection}>
                    <SearchBar
                        value=""
                        onChangeText={() => { }}
                        onPress={() => navigation.navigate('Search' as any)}
                        onImagePress={() => navigation.navigate('ImageSearch')}
                        onMicPress={() => { }}
                        placeholder='Search products, brands, deals…'
                    />
                    {/* Feature chips */}
                    <View style={styles.chipRow}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.chip}>
                            <Text style={styles.chipText}>✨ AI-Powered</Text>
                        </LinearGradient>
                        <TouchableOpacity
                            style={styles.chipOutline}
                            onPress={() => navigation.navigate('ImageSearch')}>
                            <Text style={styles.chipOutlineText}>📸 Visual Search</Text>
                        </TouchableOpacity>
                        <View style={styles.chipOutline}>
                            <Text style={styles.chipOutlineText}>🔥 Live Deals</Text>
                        </View>
                    </View>
                </View>

                {/* Category Chips */}
                <View style={styles.categoriesSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryList}>
                        {mockCategories.map(cat => {
                            const isActive = selectedCategory === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setSelectedCategory(cat.id)}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.categoryChip,
                                        isActive && {
                                            backgroundColor: Colors.primary,
                                            borderColor: Colors.primary,
                                        },
                                    ]}>
                                    <Text style={styles.catIcon}>{cat.icon}</Text>
                                    <Text
                                        style={[
                                            styles.catLabel,
                                            isActive && { color: Colors.white, fontWeight: '700' },
                                        ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Trending Deals */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🔥 Trending Deals</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Results', { query: 'trending' })}>
                            <Text style={styles.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={trending}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <DealCard
                                product={item}
                                onPress={() =>
                                    navigation.navigate('ProductDetail', { productId: item.id })
                                }
                            />
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* Products Grid */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                {selectedCategory === 'all'
                                    ? '🛍️ All Products'
                                    : mockCategories.find(c => c.id === selectedCategory)?.label}
                            </Text>
                            <Text style={styles.countText}>
                                {products.length} items
                            </Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Filter ⚙️</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.productGrid}>
                            {[1, 2, 3, 4].map(i => (
                                <View key={i} style={styles.gridItem}>
                                    <SkeletonCard />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.productGrid}>
                            {products.map(product => (
                                <View key={product.id} style={styles.gridItem}>
                                    <ProductCard
                                        product={product}
                                        onPress={() =>
                                            navigation.navigate('ProductDetail', {
                                                productId: product.id,
                                            })
                                        }
                                    />
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 110 },

    searchSection: {
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
        gap: Spacing.sm,
    },
    chipRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
    },
    chipText: {
        color: Colors.white,
        fontSize: Typography.xs,
        fontWeight: '700',
    },
    chipOutline: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    chipOutlineText: {
        color: Colors.textSecondary,
        fontSize: Typography.xs,
        fontWeight: '600',
    },

    categoriesSection: {
        marginTop: Spacing.md,
    },
    categoryList: {
        paddingHorizontal: Spacing.base,
        gap: Spacing.sm,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 1,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    catIcon: { fontSize: 14 },
    catLabel: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    section: {
        paddingHorizontal: Spacing.base,
        marginTop: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: Typography.lg,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    countText: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
        marginTop: 2,
    },
    seeAll: {
        color: Colors.primary,
        fontSize: Typography.sm,
        fontWeight: '600',
        marginTop: 3,
    },
    horizontalList: {
        paddingRight: Spacing.base,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    gridItem: { width: '48.5%' },
});
