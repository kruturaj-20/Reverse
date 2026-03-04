import { create } from 'zustand';
import { cartService, CartItem } from '../services/cart';

// Minimal product shape needed to add to cart.
// Accepts both the API Product type and the mock Product type.
interface CartProduct {
    id: string;
    price: number;
}

interface CartState {
    items: CartItem[];
    totalPrice: number;
    loading: boolean;

    loadCart: () => Promise<void>;
    addToCart: (product: CartProduct, quantity?: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    isInCart: (productId: string) => boolean;
    getCartCount: () => number;
    clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    totalPrice: 0,
    loading: false,

    loadCart: async () => {
        set({ loading: true });
        try {
            const res = await cartService.getCart();
            if (res.success && res.data) {
                // Remove deleted products or products that failed to populate
                const validItems = res.data.items.filter(i => i.product);
                set({ items: validItems, totalPrice: res.data.totalPrice });
            }
        } catch (error) {
            console.error('Failed to load cart', error);
        } finally {
            set({ loading: false });
        }
    },

    addToCart: async (product: CartProduct, quantity = 1) => {
        // ── Affiliate product guard ──────────────────────────────────────────
        // Affiliate products (amz_*, fk_*, af_*) are external link items — they
        // cannot be stored in the backend cart. Show a clear message instead.
        const AFFILIATE_PREFIXES = ['amz_', 'fk_', 'af_'];
        if (AFFILIATE_PREFIXES.some(prefix => product.id.startsWith(prefix))) {
            throw new Error('This is an external product. Tap "Buy Now" to purchase directly from the store.');
        }

        // Optimistic Update
        const currentItems = [...get().items];
        const existingItemIndex = currentItems.findIndex(i => i.productId === product.id);

        let updatedItems = [...currentItems];
        if (existingItemIndex > -1) {
            updatedItems[existingItemIndex].quantity += quantity;
        } else {
            updatedItems.push({ productId: product.id, quantity, price: product.price, product });
        }

        const newTotalPrice = get().totalPrice + (product.price * quantity);
        set({ items: updatedItems, totalPrice: newTotalPrice });

        // Network Request
        try {
            // Find total specific quantity to send to the Add/Update backend function
            const newTotalQty = existingItemIndex > -1
                ? currentItems[existingItemIndex].quantity + quantity
                : quantity;

            await cartService.addToCart(product.id, newTotalQty);
        } catch (error) {
            // Revert
            set({ items: currentItems, totalPrice: get().totalPrice - (product.price * quantity) });
            console.error('Failed to add to cart', error);
            throw error; // Re-throw to show alert if needed
        }
    },


    updateQuantity: async (productId: string, quantity: number) => {
        const currentItems = [...get().items];
        const itemIdx = currentItems.findIndex(i => i.productId === productId);
        if (itemIdx === -1) return;

        const item = currentItems[itemIdx];
        if (!item.product) return;

        const oldQty = item.quantity;
        item.quantity = quantity;

        const priceDiff = (quantity - oldQty) * item.price;
        const newTotalPrice = get().totalPrice + priceDiff;

        set({ items: currentItems, totalPrice: newTotalPrice });

        try {
            await cartService.addToCart(productId, quantity);
        } catch (error) {
            // Revert
            item.quantity = oldQty;
            set({ items: currentItems, totalPrice: newTotalPrice - priceDiff });
            console.error('Failed to update cart quantity', error);
        }
    },

    removeFromCart: async (productId: string) => {
        const currentItems = [...get().items];
        const itemIdx = currentItems.findIndex(i => i.productId === productId);
        if (itemIdx === -1) return;

        const deletedItem = currentItems[itemIdx];
        const newItems = currentItems.filter(i => i.productId !== productId);
        const newTotalPrice = get().totalPrice - (deletedItem.price * deletedItem.quantity);

        set({ items: newItems, totalPrice: newTotalPrice });

        try {
            await cartService.removeFromCart(productId);
        } catch (error) {
            // Revert
            set({ items: currentItems, totalPrice: newTotalPrice + (deletedItem.price * deletedItem.quantity) });
            console.error('Failed to remove from cart', error);
        }
    },

    isInCart: (productId: string) => {
        return get().items.some(i => i.productId === productId);
    },

    getCartCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
    },

    clearCart: () => {
        set({ items: [], totalPrice: 0 });
    }
}));
