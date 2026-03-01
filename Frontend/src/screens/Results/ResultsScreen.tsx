import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { ProductCard } from '../../components/product/ProductCard';
import { Product } from '../../data/mockProducts';
import { productService } from '../../services/products';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteP = RouteProp<RootStackParamList, 'Results'>;

const SORT_OPTIONS = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Top Rated', 'Discount'];
const STORES = ['All Stores', 'Amazon', 'Flipkart', 'Myntra', 'Meesho', 'AJIO'];

export const ResultsScreen = () => {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<RouteP>();
    const { query = '', category = '' } = route.params ?? {};

    const [selectedSort, setSelectedSort] = useState('Relevance');
    const [selectedStore, setSelectedStore] = useState('All Stores');
    const [showFilters, setShowFilters] = useState(false);

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<Product[]>([]);

    useEffect(() => {
        fetchResults();
    }, [query, category, selectedSort]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            // Map Sort option to Backend expected queries
            let sortParam;
            if (selectedSort === 'Price: Low to High') sortParam = 'price_asc';
            else if (selectedSort === 'Price: High to Low') sortParam = 'price_desc';
            else if (selectedSort === 'Top Rated') sortParam = 'rating_desc';

            let res;
            if (query) {
                res = await productService.searchProducts({ q: query, sort: sortParam });
            } else {
                res = await productService.getProducts({ category: category || undefined, sort: sortParam });
            }

            // Client-side Store Filtering
            let finalResults = res.data;
            if (selectedStore !== 'All Stores') {
                finalResults = finalResults.filter(p =>
                    p.storePrices.some(sp => sp.storeId.toLowerCase() === selectedStore.toLowerCase()),
                );
            }

            setResults(finalResults);
        } catch (error) {
            console.error('Failed to fetch results', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.queryText} numberOfLines={1}>
                            {query ? `"${query}"` : category || 'All Products'}
                        </Text>
                        <Text style={styles.resultCount}>{results.length} results</Text>
                    </View>
                    <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
                        <Text style={styles.filterText}>⚙️ Filter</Text>
                    </TouchableOpacity>
                </View>

                {/* Sort row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                    {SORT_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => setSelectedSort(opt)}
                            style={[styles.sortChip, selectedSort === opt && styles.sortChipActive]}>
                            <Text style={[styles.sortChipText, selectedSort === opt && styles.sortChipTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Store filter */}
                {showFilters && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                        {STORES.map(store => (
                            <TouchableOpacity
                                key={store}
                                onPress={() => setSelectedStore(store)}
                                style={[styles.storeChip, selectedStore === store && styles.storeChipActive]}>
                                <Text style={[styles.storeChipText, selectedStore === store && styles.storeChipTextActive]}>{store}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* AI badge */}
            {!!query && (
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>✨ AI matched these to: "{query}"</Text>
                </View>
            )}

            {loading ? (
                <View style={[styles.empty, { opacity: 0.5 }]}>
                    <Text style={styles.emptyTitle}>Loading...</Text>
                </View>
            ) : results.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptyText}>Try a different search or adjust your filters</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View style={styles.gridItem}>
                            <ProductCard
                                product={item}
                                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                            />
                        </View>
                    )}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backIcon: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '300' },
    headerCenter: { flex: 1 },
    queryText: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: '700' },
    resultCount: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
    filterBtn: { backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.surfaceBorder },
    filterText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '600' },
    sortRow: { marginBottom: Spacing.xs, paddingVertical: Spacing.xs },
    sortChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder },
    sortChipActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
    sortChipText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '500' },
    sortChipTextActive: { color: Colors.primary, fontWeight: '700' },
    storeChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder },
    storeChipActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
    storeChipText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '500' },
    storeChipTextActive: { color: Colors.accent, fontWeight: '700' },
    aiBadge: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.primaryGhost, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '33' },
    aiBadgeText: { color: Colors.primaryLight, fontSize: Typography.xs, fontWeight: '600' },
    list: { padding: Spacing.base, paddingBottom: 100 },
    row: { gap: Spacing.sm },
    gridItem: { flex: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingBottom: 80 },
    emptyIcon: { fontSize: 60 },
    emptyTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '700' },
    emptyText: { color: Colors.textMuted, fontSize: Typography.base, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
