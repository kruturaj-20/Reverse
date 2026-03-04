import React, { useState, useEffect } from 'react';
import { ApiSuccessResponse } from '../../types/api';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Product } from '../../data/mockProducts';
import { textSearch } from '../../services/search';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteP = RouteProp<RootStackParamList, 'Results'>;

const SORT_OPTIONS = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];
const STORES = ['All Stores', 'Amazon', 'Flipkart', 'Myntra', 'Meesho', 'AJIO'];

export const ResultsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { query = '', category = '' } = route.params ?? {};

  const [selectedSort, setSelectedSort] = useState('Relevance');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [aiQuery, setAiQuery] = useState<string>('');

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchResults(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, selectedSort, selectedStore]);

  const fetchResults = async (pageNumber: number) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    setError(null);
    try {
      let maxPrice: number | undefined;
      let minPrice: number | undefined;

      const sortParamMap: Record<string, string | undefined> = {
        'Price: Low to High': 'price_asc',
        'Price: High to Low': 'price_desc',
        'Top Rated': 'rating_desc',
      };

      const searchQuery = query || category;
      const res = await textSearch(searchQuery, {
        page: pageNumber,
        limit: 20,
        sort: sortParamMap[selectedSort],
        maxPrice,
        minPrice,
      });

      // Handle API wrapping response differently based on axios interceptors
      const rawData = res.data;
      const apiRes = res as unknown as ApiSuccessResponse<any[]>;
      const apiResponseData = apiRes.data || rawData; // The actual array
      let finalResults = Array.isArray(apiResponseData)
        ? apiResponseData
        : Array.isArray(rawData)
        ? rawData
        : [];

      if (selectedStore !== 'All Stores') {
        finalResults = finalResults.filter((p) =>
          p.storePrices?.some(
            (sp: any) => sp.storeId.toLowerCase() === selectedStore.toLowerCase(),
          ),
        );
      }

      if (selectedSort === 'Price: Low to High') {
        finalResults = [...finalResults].sort((a, b) => a.price - b.price);
      } else if (selectedSort === 'Price: High to Low') {
        finalResults = [...finalResults].sort((a, b) => b.price - a.price);
      } else if (selectedSort === 'Top Rated') {
        finalResults = [...finalResults].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      }

      if (pageNumber === 1) {
        setResults(finalResults);
        // If we get fewer than 20 results on page 1, there's no page 2
        setHasMore(finalResults.length === 20);
      } else {
        setResults(finalResults);
        setHasMore(finalResults.length > 0);
      }

      setAiQuery(res.meta?.query || searchQuery);
    } catch (err: any) {
      console.error('Search failed', err);
      // Only show full error state if page 1 fails
      if (pageNumber === 1) {
        setError(err?.message || 'Could not fetch results. Is the backend running?');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!loading && !loadingMore && newPage !== page) {
      setPage(newPage);
      fetchResults(newPage);
    }
  };

  const renderPagination = () => {
    if (results.length === 0 && page === 1) return null;

    // Calculate pages to show (e.g., [1, 2, 3, 4] or surrounding current page)
    const pages = [];
    const startPage = Math.max(1, page - 1);
    const endPage = hasMore ? Math.max(page + 2, 3) : page;

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        {page > 1 && (
          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => handlePageChange(page - 1)}
            disabled={loadingMore}
          >
            <Icon name="chevron-back" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}

        {pages.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.pageBtn, page === p && styles.pageBtnActive]}
            onPress={() => handlePageChange(p)}
            disabled={loadingMore || page === p}
          >
            <Text style={[styles.pageText, page === p && styles.pageTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}

        {hasMore && (
          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => handlePageChange(page + 1)}
            disabled={loadingMore}
          >
            <Icon name="chevron-forward" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.queryText} numberOfLines={1}>
              {query ? `"${query}"` : category || 'All Products'}
            </Text>
            <Text style={styles.resultCount}>
              {loading ? 'Searching...' : `${results.length} results`}
            </Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
            <Icon
              name={showFilters ? 'options' : 'options-outline'}
              size={16}
              color={showFilters ? Colors.primary : Colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterText, showFilters && styles.filterTextActive]}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Sort row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortRow}
          contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}
        >
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setSelectedSort(opt)}
              style={[styles.sortChip, selectedSort === opt && styles.sortChipActive]}
            >
              <Text
                style={[styles.sortChipText, selectedSort === opt && styles.sortChipTextActive]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Store filter */}
        {showFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortRow}
            contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}
          >
            {STORES.map((store) => (
              <TouchableOpacity
                key={store}
                onPress={() => setSelectedStore(store)}
                style={[styles.storeChip, selectedStore === store && styles.storeChipActive]}
              >
                <Text
                  style={[
                    styles.storeChipText,
                    selectedStore === store && styles.storeChipTextActive,
                  ]}
                >
                  {store}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* AI Understanding Badge */}
      {!!query && !loading && !error && (
        <View style={styles.aiBadge}>
          <Icon name="sparkles" size={12} color={Colors.primaryLight} style={{ marginRight: 4 }} />
          <Text style={styles.aiBadgeText}>AI searched: "{aiQuery}"</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.empty}>
          <Icon name="search" size={48} color={Colors.surfaceBorder} />
          <Text style={styles.emptyTitle}>AI Searching...</Text>
          <Text style={styles.emptyText}>Finding the best products for you</Text>
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Icon name="warning-outline" size={56} color={Colors.warning} />
          <Text style={styles.emptyTitle}>Search Failed</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchResults(1)}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          description="Try a different search or adjust your filters."
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                onPress={() => {
                  const isAffiliate =
                    item.id.startsWith('amz_') ||
                    item.id.startsWith('fk_') ||
                    item.id.startsWith('af_') ||
                    item.id.startsWith('un_');
                  navigation.navigate('ProductDetail', {
                    productId: item.id,
                    // Pass full product for affiliate items — avoids a second API call
                    // that returns a stub when the search cache is stale.
                    product: isAffiliate ? item : undefined,
                  });
                }}
              />
            </View>
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.footerWrap}>
              {loadingMore && <Text style={styles.footerLoaderText}>Loading page {page}...</Text>}
              {!loadingMore && renderPagination()}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentLight,
  },
  headerCenter: { flex: 1 },
  queryText: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: '700' },
  resultCount: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '600' },
  filterTextActive: { color: Colors.primary },
  sortRow: { marginBottom: Spacing.xs, paddingVertical: Spacing.xs },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sortChipActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  sortChipText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '500' },
  sortChipTextActive: { color: Colors.primary, fontWeight: '700' },
  storeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  storeChipActive: { backgroundColor: Colors.primaryGhost, borderColor: Colors.primary },
  storeChipText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '500' },
  storeChipTextActive: { color: Colors.primary, fontWeight: '700' },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.primaryGhost,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  aiBadgeText: { color: Colors.primaryLight, fontSize: Typography.xs, fontWeight: '600' },
  list: { padding: Spacing.base, paddingBottom: 120 },
  row: { gap: Spacing.sm },
  gridItem: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingBottom: 80,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '700' },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  retryText: { color: Colors.white, fontWeight: '700', fontSize: Typography.base },
  footerWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  footerLoaderText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  pageBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pageText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  pageTextActive: {
    color: Colors.white,
  },
});
