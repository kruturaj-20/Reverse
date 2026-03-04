import { create } from 'zustand';
import { Product } from '../data/mockProducts';
import { wishlistService } from '../services/wishlist';

interface WishlistState {
  items: Product[];
  groups: Record<string, Product[]>; // grouped by category
  loading: boolean;
  addToWishlist: (product: Product, targetPrice?: number) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loadWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  groups: {},
  loading: false,

  addToWishlist: async (product: Product, targetPrice?: number) => {
    // Optimistic UI update
    const currentItems = get().items;
    const newItems = [...currentItems, product];
    set({ items: newItems });

    try {
      await wishlistService.addToWishlist(product.id, targetPrice);
    } catch (e) {
      // Revert on failure
      set({ items: currentItems });
      console.error('Failed to add to wishlist', e);
    }
  },

  removeFromWishlist: async (productId: string) => {
    // Optimistic UI update
    const currentItems = get().items;
    const newItems = currentItems.filter(p => p.id !== productId);
    set({ items: newItems });

    try {
      await wishlistService.removeFromWishlist(productId);
    } catch (e) {
      // Revert on failure
      set({ items: currentItems });
      console.error('Failed to remove from wishlist', e);
    }
  },

  updateTargetPrice: async (productId: string, targetPrice: number) => {
    const currentItems = get().items;
    try {
      const res = await wishlistService.updateTargetPrice(
        productId,
        targetPrice,
      );
      // optionally update stored item if we keep price field
    } catch (e) {
      console.error('Failed to update wishlist target', e);
    }
  },
  isInWishlist: (productId: string) => {
    return (get().items ?? []).some(p => p.id === productId);
  },

  loadWishlist: async () => {
    set({ loading: true });
    try {
      const res = await wishlistService.getWishlist();
      if (res.success && res.data) {
        set({ items: res.data.products ?? [], groups: res.data.groups || {} });
      }
    } catch (e) {
      console.error('Failed to fetch wishlist', e);
    } finally {
      set({ loading: false });
    }
  },
}));
