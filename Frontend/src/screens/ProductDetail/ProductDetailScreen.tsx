import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../../theme';
import { Product } from '../../data/mockProducts';
import { productService } from '../../services/products';
import { PriceHistoryBar } from '../../components/product/PriceHistoryBar';
import { getStoreById } from '../../data/mockStores';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../../components/common/Button';
import { ProductCard } from '../../components/product/ProductCard';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteP = RouteProp<RootStackParamList, 'ProductDetail'>;

export const ProductDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { productId, product: passedProduct } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  // price intelligence states
  const [priceHistory, setPriceHistory] = useState<
    Array<{ price: number; recordedAt: string }>
  >([]);
  const [buyAdvice, setBuyAdvice] = useState<
    'buy_now' | 'wait' | 'expensive' | null
  >(null);

  const { isInWishlist, addToWishlist, removeFromWishlist } =
    useWishlistStore();
  const { addToCart } = useCartStore();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showPricePrompt, setShowPricePrompt] = useState(false);
  const [desiredPrice, setDesiredPrice] = useState('');

  React.useEffect(() => {
    // If the caller passed the full product (affiliate flow), use it immediately.
    // This avoids a second API call that would return a stub on cache miss.
    if (passedProduct) {
      setProduct(passedProduct);
      setLoading(false);
      // Still try to load related products based on category
      if (passedProduct.category) {
        productService
          .getProducts({ category: passedProduct.category, limit: 6 })
          .then(r => setRelated(r.data.filter(p => p.id !== passedProduct.id)))
          .catch(() => {}); // non-critical
      }
      // we won't fetch history/advice for affiliate stub
      return;
    }
    // DB product: fetch normally
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const res = await productService.getProductById(productId);
      const loadedProduct = res.data;
      setProduct(loadedProduct);

      if (loadedProduct) {
        const relatedRes = await productService.getProducts({
          category: loadedProduct.category,
          limit: 6,
        });
        const aiId = (relatedRes as any).aiPickId;
        const mapped = relatedRes.data
          .filter(p => p.id !== loadedProduct.id)
          .map(
            p =>
              ({
                ...p,
                isAiPick: aiId === p.id,
              } as any),
          );
        setRelated(mapped);

        // bundle suggestions
        try {
          const bundleRes = await productService.getBundleSuggestions(
            loadedProduct.id,
          );
          setBundles(bundleRes.data);
        } catch (e) {
          // ignore
        }
      }

      // fetch price history and advice for DB products
      if (
        loadedProduct &&
        !loadedProduct.id.startsWith('af_') &&
        !loadedProduct.id.startsWith('amz_') &&
        !loadedProduct.id.startsWith('fk_')
      ) {
        productService
          .getPriceHistory(loadedProduct.id)
          .then(h => setPriceHistory(h.data))
          .catch(() => {});
        productService
          .getBuyAdvice(loadedProduct.id)
          .then(a => setBuyAdvice(a.data.advice))
          .catch(() => {});
      }
    } catch (error) {
      console.error('Failed to load product', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text
          style={{
            marginTop: Spacing.md,
            color: Colors.textSecondary,
            fontSize: Typography.sm,
          }}
        >
          Loading Product...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ fontSize: 48, marginBottom: Spacing.sm }}>🔍</Text>
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: Typography.lg,
            fontWeight: '700',
          }}
        >
          Product not found
        </Text>
        <Text style={{ color: Colors.textSecondary, marginTop: Spacing.xs }}>
          It looks like this item is no longer available.
        </Text>
      </View>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const sortedStorePrices = [...(product.storePrices || [])].sort(
    (a, b) => a.price - b.price,
  );

  const isAffiliateProduct =
    product.id.startsWith('amz_') ||
    product.id.startsWith('fk_') ||
    product.id.startsWith('af_');
  const bestStorePrice = sortedStorePrices[0];

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product, 1);
      Alert.alert(
        'Added to Cart',
        'Saved! You can complete checkout via any store below.',
        [{ text: 'Okay', style: 'default' }],
      );
    } catch (e: any) {
      Alert.alert(
        'Cannot Add to Cart',
        e?.message || 'Could not add to cart. Try again.',
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async (affiliateUrl: string, storeName: string) => {
    navigation.navigate('InAppBrowser', {
      url: affiliateUrl,
      title: storeName,
    });
  };

  const handleBuyBestPrice = () => {
    if (!bestStorePrice?.affiliateUrl) {
      Alert.alert(
        'Unavailable',
        'No purchase link available for this product.',
      );
      return;
    }
    const storeName =
      bestStorePrice.storeName || bestStorePrice.storeId || 'Store';
    navigation.navigate('InAppBrowser', {
      url: bestStorePrice.affiliateUrl,
      title: storeName,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Header */}
        <SafeAreaView style={styles.stickyHeader}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.circleBtn}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => {
                if (inWishlist) removeFromWishlist(product.id);
                else setShowPricePrompt(true);
              }}
            >
              <Text style={{ fontSize: 20 }}>{inWishlist ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[selectedImageIdx] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.imageGradient}
          />
          {product.images.length > 1 && (
            <View style={styles.imageDots}>
              {product.images.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedImageIdx(i)}
                >
                  <View
                    style={[
                      styles.dot,
                      i === selectedImageIdx && styles.dotActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {product.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* target price modal */}
          <Modal
            visible={showPricePrompt}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPricePrompt(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Set price alert?</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter target price (optional)"
                  keyboardType="numeric"
                  value={desiredPrice}
                  onChangeText={setDesiredPrice}
                />
                <View style={styles.modalButtons}>
                  <Button
                    title="Cancel"
                    onPress={() => setShowPricePrompt(false)}
                  />
                  <Button
                    title="Add"
                    onPress={() => {
                      const val = parseFloat(desiredPrice);
                      addToWishlist(product, isNaN(val) ? undefined : val);
                      setShowPricePrompt(false);
                      setDesiredPrice('');
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
          {/* Brand + Name */}
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.starText}>⭐ {product.rating}</Text>
            <Text style={styles.reviewText}>
              ({product.reviews || []} reviews)
            </Text>
            {product.isSponsored && (
              <View style={styles.adBadge}>
                <Text style={styles.adText}>Sponsored</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
            <Text style={styles.originalPrice}>
              ₹{product.originalPrice.toLocaleString()}
            </Text>
            <Text style={styles.savings}>
              Save ₹{(product.originalPrice - product.price).toLocaleString()}
            </Text>
          </View>
          {/* price history sparkline + advice badge */}
          {priceHistory.length > 0 && (
            <View style={{ marginTop: Spacing.sm }}>
              <PriceHistoryBar
                history={priceHistory}
                currentPrice={product.price}
              />
            </View>
          )}
          {buyAdvice && (
            <Text
              style={{
                marginTop: Spacing.xs,
                color:
                  buyAdvice === 'buy_now'
                    ? Colors.success
                    : buyAdvice === 'expensive'
                    ? Colors.warning
                    : Colors.textPrimary,
                fontWeight: '700',
              }}
            >
              {buyAdvice === 'buy_now' && '🟢 Best time to buy'}
              {buyAdvice === 'wait' && '🟡 Price may dip soon'}
              {buyAdvice === 'expensive' && '🔴 Price above average'}
            </Text>
          )}

          {/* Description */}
          <Text style={styles.description}>{product.description}</Text>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {product.tags.map((tag: string) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Price Comparison Table */}
          <View style={styles.priceTable}>
            <Text style={styles.tableTitle}>🏪 Price Comparison</Text>
            {sortedStorePrices.map((sp, i) => {
              const store = getStoreById(sp.storeId);
              return (
                <View
                  key={sp.storeId}
                  style={[styles.storeRow, i === 0 && styles.bestDealRow]}
                >
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeEmoji}>{store?.logo ?? '🛒'}</Text>
                    <View>
                      <Text style={styles.storeName}>
                        {store?.name ?? sp.storeId}
                      </Text>
                      {i === 0 && (
                        <Text style={styles.bestDealLabel}>Best Price</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.storePriceCol}>
                    <Text
                      style={[
                        styles.storePrice,
                        i === 0 && { color: Colors.success },
                      ]}
                    >
                      ₹{sp.price.toLocaleString()}
                    </Text>
                    {sp.deliveryDays && (
                      <Text style={styles.delivery}>
                        {sp.deliveryDays}d delivery
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleBuyNow(sp.affiliateUrl, store?.name ?? '')
                    }
                    style={[styles.dealBtn, !sp.inStock && styles.dealBtnOOS]}
                    disabled={!sp.inStock || addingToCart}
                  >
                    <Text style={styles.dealBtnText}>
                      {sp.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Bundle Suggestions (Complete the Look) */}
          {bundles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.tableTitle}>
                👗 People also buy with this
              </Text>
              <FlatList
                data={bundles}
                keyExtractor={p => p.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={{ width: 160, marginRight: Spacing.sm }}>
                    <ProductCard
                      product={item}
                      onPress={() =>
                        navigation.push('ProductDetail', { productId: item.id })
                      }
                      isAiPick={item.isAiPick}
                    />
                  </View>
                )}
              />
            </View>
          )}

          {/* Related Products */}
          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.tableTitle}>🔗 You may also like</Text>
              <FlatList
                data={related}
                keyExtractor={p => p.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={{ width: 160, marginRight: Spacing.sm }}>
                    <ProductCard
                      product={item}
                      onPress={() => {
                        const isAffiliate =
                          item.id.startsWith('amz_') ||
                          item.id.startsWith('fk_') ||
                          item.id.startsWith('af_');
                        navigation.replace('ProductDetail', {
                          productId: item.id,
                          product: isAffiliate ? item : undefined,
                        });
                      }}
                    />
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <SafeAreaView style={styles.bottomSafe}>
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.bottomLabel}>
                {isAffiliateProduct ? 'Best price from' : 'Ships from us'}
              </Text>
              <Text style={styles.bottomPrice}>
                ₹
                {(isAffiliateProduct
                  ? bestStorePrice?.price
                  : product.price
                )?.toLocaleString() ?? '—'}
              </Text>
            </View>
            {isAffiliateProduct ? (
              // ── Affiliate product: open InAppBrowser WebView ──────────────────
              // Payment happens on Amazon / Flipkart's own checkout inside the WebView.
              <Button
                title={`🛒  Buy Now`}
                onPress={handleBuyBestPrice}
                style={{ flex: 1, marginLeft: Spacing.base }}
                size="lg"
              />
            ) : (
              // ── DB / own-stock product: Razorpay checkout in app ──────────────
              <Button
                title={addingToCart ? 'Adding...' : '🛒  Add To Cart'}
                onPress={handleAddToCart}
                style={{ flex: 1, marginLeft: Spacing.base }}
                size="lg"
                disabled={addingToCart}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stickyHeader: { backgroundColor: Colors.background + 'CC' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  backIcon: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: '300',
  },
  imageContainer: {
    height: 320,
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
  },
  heroImage: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  imageDots: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  dotActive: { backgroundColor: Colors.primary, width: 18 },
  discountBadge: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  discountText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: '800',
  },
  content: { padding: Spacing.base, paddingBottom: 120, gap: Spacing.sm },
  brand: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: '800',
    lineHeight: 28,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  starText: {
    color: Colors.gold,
    fontWeight: '700',
    fontSize: Typography.base,
  },
  reviewText: { color: Colors.textMuted, fontSize: Typography.sm },
  adBadge: {
    backgroundColor: Colors.warning + '22',
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adText: { color: Colors.warning, fontSize: Typography.xs, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  price: {
    fontSize: Typography.xxxl,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: Typography.sm,
    color: Colors.success,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: 22,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tagText: { color: Colors.textMuted, fontSize: Typography.xs },
  priceTable: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.sm,
  },
  tableTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  bestDealRow: {
    backgroundColor: Colors.success + '11',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderTopWidth: 0,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  storeEmoji: { fontSize: 20 },
  storeName: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  bestDealLabel: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  storePriceCol: { alignItems: 'flex-end', marginRight: Spacing.sm },
  storePrice: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: '800',
  },
  delivery: { color: Colors.textMuted, fontSize: Typography.xs },
  dealBtn: {
    backgroundColor: Colors.primaryGhost,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '66',
  },
  dealBtnOOS: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.surfaceBorder,
  },
  dealBtnText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  relatedSection: { marginTop: Spacing.sm, gap: Spacing.sm },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  bottomSafe: {},
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  bottomLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  bottomPrice: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    fontSize: Typography.base,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
});
