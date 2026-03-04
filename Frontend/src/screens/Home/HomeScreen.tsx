import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { HomeHeader } from '../../components/common/HomeHeader';
import { FilterSearchBar } from '../../components/common/FilterSearchBar';
import { CategoryList } from '../../components/common/CategoryList';
import { BuyerRequestCard } from '../../components/common/BuyerRequestCard';
import { CustomText } from '../../components/common/CustomText';
import { productService } from '../../services/products';
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

// Mock buyer requests (Reverse marketplace scenario)
const MOCK_REQUESTS = [
  {
    id: '1',
    title: 'Looking for a slightly used iPhone 13 Pro (Graphite)',
    budget: 450,
    quotesReceived: 3,
    timeRemaining: 'Closing in: 04:12:30',
    imageUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop',
    isFavorite: false,
  },
  {
    id: '2',
    title: 'Need a customized wooden study table',
    budget: 120,
    quotesReceived: 0,
    timeRemaining: 'Closing in: 12:45:00',
    imageUrl:
      'https://images.unsplash.com/photo-1595514535497-28e6791b86e0?q=80&w=300&auto=format&fit=crop',
    isFavorite: true,
  },
  {
    id: '3',
    title: 'PlayStation 5 Disc Edition required',
    budget: 400,
    quotesReceived: 5,
    timeRemaining: 'Closing in: 01:10:00',
    imageUrl:
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=300&auto=format&fit=crop',
    isFavorite: false,
  },
];

const FILTER_TABS = ['All', 'Newest', 'High Budget', 'Zero Quotes'];

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [activeFilter, setActiveFilter] = useState(0);
  const [personalized, setPersonalized] = useState<Product[]>([]);

  React.useEffect(() => {
    // load personalized feed if available
    productService
      .getPersonalizedFeed()
      .then(r => {
        setPersonalized(r.data);
      })
      .catch(() => {
        // ignore if not authenticated or error
      });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {/* Minimal Location Header */}
      <HomeHeader
        location="New York, USA"
        onNotificationPress={() => console.log('Notifications')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search & Filter */}
        <FilterSearchBar placeholder="Search Buyer Requests..." />

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
              {personalized.map(p => (
                <View
                  key={p.id}
                  style={{ width: 160, marginRight: Spacing.sm }}
                >
                  <ProductCard
                    product={p}
                    onPress={() =>
                      navigation.navigate('ProductDetail', { productId: p.id })
                    }
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Promotional / Active Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <CustomText variant="lg" weight="bold" color={Colors.textPrimary}>
              Active Bids
            </CustomText>
            <CustomText
              variant="sm"
              color={Colors.textSecondary}
              style={styles.bannerSub}
            >
              3 of your quotes are currently winning!
            </CustomText>
            <View style={styles.bannerButton}>
              <CustomText variant="xs" weight="bold" color={Colors.white}>
                View Bids →
              </CustomText>
            </View>
          </View>
          <Text style={styles.bannerEmoji}>🎉</Text>
        </View>

        {/* Categories */}
        <CategoryList categories={MOCK_CATEGORIES} />

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
              style={[
                styles.filterTab,
                activeFilter === idx && styles.filterTabActive,
              ]}
            >
              <CustomText
                variant="sm"
                weight={activeFilter === idx ? '700' : '500'}
                color={
                  activeFilter === idx ? Colors.white : Colors.textSecondary
                }
              >
                {tab}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommended Grid */}
        <View style={styles.gridContainer}>
          {MOCK_REQUESTS.map(request => (
            <View key={`grid-${request.id}`} style={styles.gridItem}>
              <BuyerRequestCard
                title={request.title}
                budget={request.budget}
                quotesReceived={request.quotesReceived}
                timeRemaining={request.timeRemaining}
                imageUrl={request.imageUrl}
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
