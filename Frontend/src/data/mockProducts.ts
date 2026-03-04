export interface StorePricing {
  storeId: string;
  storeName?: string; // Display name e.g. "Amazon India", "Flipkart"
  price: number;
  inStock: boolean;
  affiliateUrl: string;
  deliveryDays?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  images: string[];
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  primaryStore: string;
  storePrices: StorePricing[];
  description: string;
  isTrending?: boolean;
  isSponsored?: boolean;
  isAiPick?: boolean; // set by backend when this item is AI-picked in a listing
  affiliateUrl?: string; // Primary buy link (from affiliate/Amazon)
}

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Nike Air Max 270',
    brand: 'Nike',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
    ],
    price: 1799,
    originalPrice: 3499,
    discount: 49,
    category: 'footwear',
    tags: ['white sneakers', 'running', 'casual', 'nike'],
    rating: 4.5,
    reviews: 2341,
    primaryStore: 'amazon',
    storePrices: [
      {
        storeId: 'amazon',
        price: 1799,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/B08XYZ',
        deliveryDays: 2,
      },
      {
        storeId: 'flipkart',
        price: 1899,
        inStock: true,
        affiliateUrl: 'https://flipkart.com/p/nike-air',
        deliveryDays: 3,
      },
      {
        storeId: 'myntra',
        price: 2199,
        inStock: false,
        affiliateUrl: 'https://myntra.com/nike-air',
        deliveryDays: 5,
      },
    ],
    description:
      'Experience ultimate comfort with the Nike Air Max 270. Features a large Air unit in the heel for maximum cushioning.',
    isTrending: true,
  },
  {
    id: 'p2',
    name: 'Samsung Galaxy Buds 2 Pro',
    brand: 'Samsung',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    ],
    price: 8999,
    originalPrice: 14999,
    discount: 40,
    category: 'electronics',
    tags: ['earbuds', 'wireless', 'ANC', 'samsung', 'bluetooth'],
    rating: 4.4,
    reviews: 5672,
    primaryStore: 'flipkart',
    storePrices: [
      {
        storeId: 'flipkart',
        price: 8999,
        inStock: true,
        affiliateUrl: 'https://flipkart.com/p/galaxy-buds',
        deliveryDays: 2,
      },
      {
        storeId: 'amazon',
        price: 9499,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/galaxy-buds',
        deliveryDays: 1,
      },
    ],
    description:
      'Premium wireless earbuds with Active Noise Cancellation, 360° audio, and 29-hour battery life.',
    isTrending: true,
  },
  {
    id: 'p3',
    name: "Levi's 511 Slim Fit Jeans",
    brand: "Levi's",
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
    price: 1499,
    originalPrice: 2999,
    discount: 50,
    category: 'fashion',
    tags: ['jeans', 'slim fit', 'denim', 'levis', 'casual'],
    rating: 4.3,
    reviews: 8901,
    primaryStore: 'myntra',
    storePrices: [
      {
        storeId: 'myntra',
        price: 1499,
        inStock: true,
        affiliateUrl: 'https://myntra.com/levis-511',
        deliveryDays: 4,
      },
      {
        storeId: 'amazon',
        price: 1699,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/levis-511',
        deliveryDays: 2,
      },
      {
        storeId: 'ajio',
        price: 1599,
        inStock: true,
        affiliateUrl: 'https://ajio.com/levis-511',
        deliveryDays: 5,
      },
    ],
    description:
      "Levi's iconic 511 slim fit jeans in classic indigo. Made with stretch denim for all-day comfort.",
    isTrending: false,
  },
  {
    id: 'p4',
    name: 'boAt Rockerz 550 Wireless Headphones',
    brand: 'boAt',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    ],
    price: 1499,
    originalPrice: 3990,
    discount: 62,
    category: 'electronics',
    tags: ['headphones', 'wireless', 'bass', 'boat'],
    rating: 4.2,
    reviews: 41203,
    primaryStore: 'amazon',
    storePrices: [
      {
        storeId: 'amazon',
        price: 1499,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/boat-550',
        deliveryDays: 1,
      },
      {
        storeId: 'flipkart',
        price: 1599,
        inStock: true,
        affiliateUrl: 'https://flipkart.com/p/boat-550',
        deliveryDays: 3,
      },
      {
        storeId: 'meesho',
        price: 1349,
        inStock: true,
        affiliateUrl: 'https://meesho.com/boat-550',
        deliveryDays: 7,
      },
    ],
    description:
      'boAt Rockerz 550 with 20-hour playback, immersive bass, and plush cushions for long-wearing comfort.',
    isTrending: true,
  },
  {
    id: 'p5',
    name: 'Puma Virat Kohli T-Shirt',
    brand: 'Puma',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    ],
    price: 799,
    originalPrice: 1499,
    discount: 47,
    category: 'fashion',
    tags: ['t-shirt', 'sports', 'puma', 'casual'],
    rating: 4.1,
    reviews: 3210,
    primaryStore: 'meesho',
    storePrices: [
      {
        storeId: 'meesho',
        price: 799,
        inStock: true,
        affiliateUrl: 'https://meesho.com/puma-tshirt',
        deliveryDays: 6,
      },
      {
        storeId: 'myntra',
        price: 999,
        inStock: true,
        affiliateUrl: 'https://myntra.com/puma-tshirt',
        deliveryDays: 3,
      },
    ],
    description:
      "Lightweight dryCELL technology T-shirt from Puma's Virat Kohli collection. Perfect for workouts and casual wear.",
    isTrending: false,
  },
  {
    id: 'p6',
    name: 'Xiaomi Redmi Watch 4',
    brand: 'Xiaomi',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    ],
    price: 3999,
    originalPrice: 5999,
    discount: 33,
    category: 'electronics',
    tags: ['smartwatch', 'fitness', 'xiaomi', 'redmi'],
    rating: 4.3,
    reviews: 9120,
    primaryStore: 'flipkart',
    storePrices: [
      {
        storeId: 'flipkart',
        price: 3999,
        inStock: true,
        affiliateUrl: 'https://flipkart.com/p/redmi-watch4',
        deliveryDays: 2,
      },
      {
        storeId: 'amazon',
        price: 4199,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/redmi-watch4',
        deliveryDays: 1,
      },
    ],
    description:
      'Redmi Watch 4 with 1.97" AMOLED display, 150+ sport modes, GPS, and 20-day battery life.',
    isTrending: true,
  },
  {
    id: 'p7',
    name: 'Wildcraft Unisex Backpack 30L',
    brand: 'Wildcraft',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
    price: 999,
    originalPrice: 2499,
    discount: 60,
    category: 'fashion',
    tags: ['backpack', 'bag', 'travel', 'wildcraft'],
    rating: 4.0,
    reviews: 6780,
    primaryStore: 'amazon',
    storePrices: [
      {
        storeId: 'amazon',
        price: 999,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/wildcraft-bp',
        deliveryDays: 2,
      },
      {
        storeId: 'flipkart',
        price: 1099,
        inStock: true,
        affiliateUrl: 'https://flipkart.com/p/wildcraft-bp',
        deliveryDays: 3,
      },
    ],
    description:
      '30L durable polyester backpack with multiple compartments, laptop sleeve, and rain cover.',
    isTrending: false,
  },
  {
    id: 'p8',
    name: 'Maybelline Fit Me Foundation',
    brand: 'Maybelline',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    ],
    price: 349,
    originalPrice: 599,
    discount: 42,
    category: 'beauty',
    tags: ['makeup', 'foundation', 'maybelline', 'beauty'],
    rating: 4.4,
    reviews: 15640,
    primaryStore: 'myntra',
    storePrices: [
      {
        storeId: 'myntra',
        price: 349,
        inStock: true,
        affiliateUrl: 'https://myntra.com/maybelline-fitme',
        deliveryDays: 3,
      },
      {
        storeId: 'amazon',
        price: 379,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/maybelline-fitme',
        deliveryDays: 2,
      },
      {
        storeId: 'meesho',
        price: 299,
        inStock: true,
        affiliateUrl: 'https://meesho.com/maybelline',
        deliveryDays: 8,
      },
    ],
    description:
      'Maybelline Fit Me Matte+Poreless Foundation for a natural, breathable finish. Available in 40+ shades.',
    isTrending: false,
  },
  {
    id: 'p9',
    name: 'Adidas Ultraboost 22 Running Shoes',
    brand: 'Adidas',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
    ],
    price: 5999,
    originalPrice: 12999,
    discount: 54,
    category: 'footwear',
    tags: ['running shoes', 'adidas', 'boost', 'sport'],
    rating: 4.6,
    reviews: 4320,
    primaryStore: 'amazon',
    storePrices: [
      {
        storeId: 'amazon',
        price: 5999,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/adidas-ub22',
        deliveryDays: 2,
      },
      {
        storeId: 'flipkart',
        price: 6499,
        inStock: false,
        affiliateUrl: 'https://flipkart.com/p/adidas-ub22',
        deliveryDays: 4,
      },
      {
        storeId: 'ajio',
        price: 6299,
        inStock: true,
        affiliateUrl: 'https://ajio.com/adidas-ultraboost',
        deliveryDays: 5,
      },
    ],
    description:
      'Adidas Ultraboost 22 with responsive BOOST midsole and Primeknit+ upper for an energized run.',
    isTrending: true,
    isSponsored: true,
  },
  {
    id: 'p10',
    name: 'JBL Flip 6 Waterproof Speaker',
    brand: 'JBL',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    ],
    price: 6999,
    originalPrice: 11999,
    discount: 42,
    category: 'electronics',
    tags: ['speaker', 'bluetooth', 'waterproof', 'jbl'],
    rating: 4.7,
    reviews: 18430,
    primaryStore: 'amazon',
    storePrices: [
      {
        storeId: 'amazon',
        price: 6999,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/jbl-flip6',
        deliveryDays: 1,
      },
      {
        storeId: 'flipkart',
        price: 7199,
        inStock: true,
        affiliateUrl: 'https://flipkart.com/p/jbl-flip6',
        deliveryDays: 2,
      },
    ],
    description:
      'JBL Flip 6 with powerful sound, IP67 waterproofing, and 12-hour playtime. PartyBoost compatible.',
    isTrending: true,
  },
  {
    id: 'p11',
    name: 'H&M Oversized Cotton Hoodie',
    brand: 'H&M',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400'],
    price: 1299,
    originalPrice: 2499,
    discount: 48,
    category: 'fashion',
    tags: ['hoodie', 'oversized', 'cotton', 'hm', 'casual'],
    rating: 4.2,
    reviews: 2190,
    primaryStore: 'myntra',
    storePrices: [
      {
        storeId: 'myntra',
        price: 1299,
        inStock: true,
        affiliateUrl: 'https://myntra.com/hm-hoodie',
        deliveryDays: 3,
      },
      {
        storeId: 'ajio',
        price: 1399,
        inStock: true,
        affiliateUrl: 'https://ajio.com/hm-hoodie',
        deliveryDays: 5,
      },
    ],
    description:
      'Relaxed-fit hoodie in organic cotton with kangaroo pocket and adjustable drawstring hood.',
    isTrending: false,
  },
  {
    id: 'p12',
    name: 'Philips Air Fryer HD9200',
    brand: 'Philips',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    images: [
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    ],
    price: 5499,
    originalPrice: 8999,
    discount: 39,
    category: 'home',
    tags: ['air fryer', 'kitchen', 'philips', 'appliance'],
    rating: 4.5,
    reviews: 32100,
    primaryStore: 'amazon',
    storePrices: [
      {
        storeId: 'amazon',
        price: 5499,
        inStock: true,
        affiliateUrl: 'https://amazon.in/dp/philips-af',
        deliveryDays: 2,
      },
      {
        storeId: 'flipkart',
        price: 5799,
        inStock: true,
        affiliateUrl: 'https://flipkart.com/p/philips-af',
        deliveryDays: 3,
      },
      {
        storeId: 'snapdeal',
        price: 5299,
        inStock: true,
        affiliateUrl: 'https://snapdeal.com/philips-af',
        deliveryDays: 6,
      },
    ],
    description:
      'Philips 4.1L Rapid Air technology air fryer. Up to 90% less fat. Perfect for healthy cooking.',
    isTrending: false,
  },
];

export const getTrendingProducts = () => mockProducts.filter(p => p.isTrending);
export const getProductById = (id: string) =>
  mockProducts.find(p => p.id === id);
export const getProductsByCategory = (cat: string) =>
  cat === 'all' ? mockProducts : mockProducts.filter(p => p.category === cat);
export const searchProducts = (query: string) => {
  const q = query.toLowerCase();
  return mockProducts.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) ||
      p.category.includes(q),
  );
};
