import React, { useState, useEffect, useMemo } from 'react';
import { ApiSuccessResponse } from '../../types/api';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { HomeHeader } from '../../components/common/HomeHeader';
import { FilterSearchBar } from '../../components/common/FilterSearchBar';
import { CategoryList } from '../../components/common/CategoryList';
import { CustomText } from '../../components/common/CustomText';
import { productService } from '../../services/products';
import { textSearch } from '../../services/search';
import { Product } from '../../data/mockProducts';
import { ProductCard } from '../../components/product/ProductCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

// Mock data adapting product categories to reverse marketplace categories
const MOCK_CATEGORIES = [
  { id: '1', name: 'Electronics', icon: '📱' },
  { id: '2', name: 'Furniture', icon: '🛋️' },
  { id: '3', name: 'Vehicles', icon: '🚗' },
  { id: '4', name: 'Fashion', icon: '👕' },
  { id: '5', name: 'Services', icon: '🛠️' },
];

const FILTER_TABS = ['All', 'Newest', 'High Budget', 'Zero Quotes'];

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [activeFilter, setActiveFilter] = useState(0);
  const [personalized, setPersonalized] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiPickId, setAiPickId] = useState<string | null>(null);
  const [budgetMode, setBudgetMode] = useState(false);
  const [budget, setBudget] = useState(500); // default rupees

  // derived list after applying the active filter tabs
  const displayProducts = useMemo(() => {
    if (!products) return [];
    const list = [...products];
    switch (activeFilter) {
      case 1: // Newest
        return list.sort((a, b) => {
          // createdAt may be ISO string
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      case 2: // High Budget -> sort by price descending
        return list.sort((a, b) => b.price - a.price);
      case 3: // Zero Quotes -> no quotes field, fall back to empty set or affiliate only
        return list.filter(
          (p) => p.id.startsWith('amz_') || p.id.startsWith('fk_') || p.id.startsWith('af_'),
        );
      default:
        return list;
    }
  }, [products, activeFilter]);

  useEffect(() => {
    // load personalized feed if available
    productService
      .getPersonalizedFeed()
      .then((r) => {
        setPersonalized(r.data);
      })
      .catch(() => {
        // ignore if not authenticated or error
      });

    // fetch general product feed
    const params: any = {};
    if (budgetMode) params.maxPrice = budget;
    productService
      .getProducts(params)
      .then((r) => {
        setProducts(r.data);
        if ('aiPickId' in r) setAiPickId((r as unknown as ApiSuccessResponse<any>).aiPickId);
      })
      .catch(() => {});

    // also grab some affiliate products with an empty search (category filter optional)
    textSearch('', { limit: 20 })
      .then((r) => {
        // merge, avoiding duplicates by id
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const extras = r.data.filter((p) => !existingIds.has(p.id));
          return [...prev, ...extras];
        });
      })
      .catch(() => {});
  }, [budgetMode, budget]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {/* Minimal Location Header */}
      <HomeHeader
        location="New York, USA"
        onNotificationPress={() => console.log('Notifications')}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search & Filter */}
        <FilterSearchBar
          placeholder="Search products..."
          onFilterPress={() => setBudgetMode((m) => !m)}
        />
        {budgetMode && (
          <View style={styles.budgetBanner}>
            <Text style={styles.budgetText}>Budget mode: ₹{budget}</Text>
          </View>
        )}

        {/* Personalized Recommendations */}
        {personalized.length > 0 && (
          <View style={{ marginVertical: Spacing.md }}>
            <Text
              style={{
                paddingHorizontal: Spacing.base,
                fontSize: Typography.lg,
                fontWeight: '700',
              }}
            >
              Because you searched recently
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: Spacing.base,
                paddingTop: Spacing.sm,
              }}
            >
              {personalized.map((p) => (
                <View key={p.id} style={{ width: 160, marginRight: Spacing.sm }}>
                  <ProductCard
                    product={p}
                    onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Promotional / Great Deals Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <CustomText variant="lg" weight="bold" color={Colors.textPrimary}>
              Great Deals
            </CustomText>
            <CustomText variant="sm" color={Colors.textSecondary} style={styles.bannerSub}>
              Top offers from across the platform and affiliate partners
            </CustomText>
            <View style={styles.bannerButton}>
              <CustomText variant="xs" weight="bold" color={Colors.white}>
                View Deals →
              </CustomText>
            </View>
          </View>
          <Text style={styles.bannerEmoji}>🎉</Text>
        </View>

        {/* Categories */}
        <CategoryList
          categories={MOCK_CATEGORIES}
          onPress={(cat) => navigation.navigate('Results', { category: cat.name.toLowerCase() })}
        />

        {/* Urgent Buyer Requests */}
        {/* <View style={styles.sectionHeader}>
                    <CustomText variant="lg" weight="bold">Urgent Requests</CustomText>
                    <CustomText variant="sm" weight="500" color={Colors.primary}>See All</CustomText>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsRow}
                >
                    {MOCK_REQUESTS.map((request) => (
                        <BuyerRequestCard
                            key={request.id}
                            title={request.title}
                            budget={request.budget}
                            quotesReceived={request.quotesReceived}
                            timeRemaining={request.timeRemaining}
                            imageUrl={request.imageUrl}
                            isFavorite={request.isFavorite}
                        />
                    ))}
                </ScrollView> */}

        {/* Recommended Filter Tabs */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <CustomText variant="lg" weight="bold">
            Recommended
          </CustomText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {FILTER_TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveFilter(idx)}
              style={[styles.filterTab, activeFilter === idx && styles.filterTabActive]}
            >
              <CustomText
                variant="sm"
                weight={activeFilter === idx ? '700' : '500'}
                color={activeFilter === idx ? Colors.white : Colors.textSecondary}
              >
                {tab}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product Grid */}
        <View style={styles.gridContainer}>
          {displayProducts.map((p) => (
            <View key={p.id} style={styles.gridItem}>
              <ProductCard
                product={p}
                onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                isInWishlist={false}
                isAiPick={p.id === aiPickId}
              />
            </View>
          ))}
        </View>

        {/* Bottom Padding for Floating Tab Bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: Spacing.xs,
  },
  bannerContainer: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.accentLight,
    borderRadius: 24,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  bannerContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  bannerSub: {
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  bannerButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerEmoji: {
    fontSize: 48,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  cardsRow: {
    paddingLeft: Spacing.base,
    paddingRight: Spacing.sm,
  },
  budgetBanner: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
  },
  budgetText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  filterTabs: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  gridItem: {
    width: '48%',
  },
  bottomSpacer: {
    height: 120,
  },
});
