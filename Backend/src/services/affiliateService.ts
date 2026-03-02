import axios from 'axios';
import { SearchIntent } from './geminiService';
import logger from '../utils/logger';

// ─── Product Shapes ───────────────────────────────────────────────────────────

export interface StorePricing {
    storeId: string;
    storeName: string;
    price: number;
    inStock: boolean;
    affiliateUrl: string;
    deliveryDays?: number;
}

export interface AffiliateProduct {
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
    affiliateUrl?: string;
}

// ─── RapidAPI Config ──────────────────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// ─── Real-Time Amazon Data API (RapidAPI) ────────────────────────────────────

interface AmazonProduct {
    asin: string;
    product_title: string;
    product_price: string;      // e.g. "₹1,299"
    product_original_price?: string;
    product_star_rating?: string;
    product_num_ratings?: number;
    product_url: string;
    product_photo: string;
    is_prime?: boolean;
    sales_volume?: string;
    climate_pledge_friendly?: boolean;
    product_availability?: string;
}

const parsePrice = (priceStr?: string): number => {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/[^\d.]/g, '');
    return Math.round(parseFloat(cleaned)) || 0;
};

const mapAmazonProduct = (p: AmazonProduct, index: number): AffiliateProduct => {
    const price = parsePrice(p.product_price);
    const originalPrice = parsePrice(p.product_original_price) || Math.round(price * 1.25);
    const discount = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    const rating = parseFloat(p.product_star_rating || '4.0') || 4.0;
    const reviews = p.product_num_ratings || 100;

    // Build a clean affiliate/direct URL
    const affiliateUrl = p.product_url.startsWith('http')
        ? p.product_url
        : `https://www.amazon.in/dp/${p.asin}`;

    // Derive category from title keywords
    const titleLower = p.product_title.toLowerCase();
    let category = 'general';
    if (/headphone|earphone|speaker|earbud|bluetooth audio/.test(titleLower)) category = 'electronics';
    else if (/shoe|sneaker|boot|sandal|slipper|footwear/.test(titleLower)) category = 'footwear';
    else if (/shirt|jeans|kurta|dress|hoodie|jacket|t-shirt|trouser|legging/.test(titleLower)) category = 'fashion';
    else if (/watch|laptop|tablet|phone|camera|keyboard|mouse|monitor/.test(titleLower)) category = 'electronics';
    else if (/serum|moisturizer|shampoo|cream|foundation|lipstick|perfume/.test(titleLower)) category = 'beauty';
    else if (/sofa|chair|lamp|fan|cooler|mixer|air fryer|induction|mattress/.test(titleLower)) category = 'home';

    const tags = p.product_title.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 8);

    return {
        id: `amz_${p.asin || index}`,
        name: p.product_title,
        brand: extractBrand(p.product_title),
        image: p.product_photo,
        images: [p.product_photo],
        price,
        originalPrice,
        discount,
        category,
        tags,
        rating,
        reviews,
        primaryStore: 'amazon',
        storePrices: [
            {
                storeId: 'amazon',
                storeName: 'Amazon India',
                price,
                inStock: (p.product_availability || 'In Stock').toLowerCase().includes('in stock'),
                affiliateUrl,
                deliveryDays: p.is_prime ? 1 : 3,
            },
        ],
        description: p.product_title,
        isTrending: !!(p.sales_volume && parseInt(p.sales_volume.replace(/\D/g, '')) > 1000),
        affiliateUrl,
    };
};

/** Heuristic: extract brand from first 1-2 capitalized words */
const extractBrand = (title: string): string => {
    const words = title.split(' ');
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    // Many product titles start with brand name
    const knownBrands = ['samsung', 'apple', 'sony', 'boat', 'jbl', 'nike', 'adidas', 'levi', 'h&m',
        'philips', 'loreal', "l'oreal", 'bose', 'realme', 'oneplus', 'xiaomi', 'redmi',
        'oppo', 'vivo', 'lg', 'mi', 'lenovo', 'hp', 'dell', 'asus', 'acer', 'iphone',
        'wildcraft', 'skybags', 'american tourister', 'fastrack', 'titan'];
    const titleLower = title.toLowerCase();
    for (const b of knownBrands) {
        if (titleLower.startsWith(b)) return capitalize(b);
    }
    return words[0] ? capitalize(words[0]) : 'Unknown';
};

/** Search Amazon via RapidAPI Real-Time Amazon Data */
const searchAmazon = async (intent: SearchIntent, limit: number): Promise<AffiliateProduct[]> => {
    if (!RAPIDAPI_KEY) return [];

    const keyword = intent.keywords.join(' ') || intent.rawQuery;
    if (!keyword.trim()) return [];

    try {
        const params: Record<string, string | number> = {
            query: keyword,
            page: '1',
            country: 'IN',
            sort_by: 'RELEVANCE',
            product_condition: 'ALL',
        };
        if (intent.maxPrice) params.max_price = intent.maxPrice;
        if (intent.minPrice) params.min_price = intent.minPrice;
        if (intent.brand) params.query = `${intent.brand} ${keyword}`;

        const response = await axios.get<{ data?: { products?: AmazonProduct[] }; products?: AmazonProduct[] }>(
            'https://real-time-amazon-data.p.rapidapi.com/search',
            {
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
                },
                params,
                timeout: 10000,
            },
        );

        const products: AmazonProduct[] =
            response.data?.data?.products ||
            (response.data as unknown as { products?: AmazonProduct[] })?.products ||
            [];

        logger.info(`Amazon search (${keyword}): ${products.length} products`);
        return products.slice(0, limit).map(mapAmazonProduct);
    } catch (err: unknown) {
        const error = err as { response?: { status?: number; data?: unknown }; message?: string };
        logger.error(`Amazon RapidAPI error: ${error?.response?.status} — ${JSON.stringify(error?.response?.data || error?.message)}`);
        return [];
    }
};

// ─── Flipkart Search via RapidAPI ─────────────────────────────────────────────

interface FlipkartProduct {
    pid: string;
    title: string;
    price?: number;
    mrp?: number;
    discount?: string;
    image?: string;
    url?: string;
    rating?: number;
    ratingCount?: number;
    brand?: string;
    availability?: string;
}

const mapFlipkartProduct = (p: FlipkartProduct, index: number): AffiliateProduct => {
    const price = p.price || 0;
    const originalPrice = p.mrp || Math.round(price * 1.2);
    const discount = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    const affiliateUrl = p.url?.startsWith('http') ? p.url : `https://www.flipkart.com`;

    return {
        id: `fk_${p.pid || index}`,
        name: p.title,
        brand: p.brand || extractBrand(p.title),
        image: p.image || '',
        images: [p.image || ''],
        price,
        originalPrice,
        discount,
        category: 'general',
        tags: p.title.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 8),
        rating: p.rating || 4.0,
        reviews: p.ratingCount || 100,
        primaryStore: 'flipkart',
        storePrices: [
            {
                storeId: 'flipkart',
                storeName: 'Flipkart',
                price,
                inStock: (p.availability || 'In Stock').toLowerCase().includes('in stock'),
                affiliateUrl,
                deliveryDays: 3,
            },
        ],
        description: p.title,
        affiliateUrl,
    };
};

/** Search Flipkart via RapidAPI */
const searchFlipkart = async (intent: SearchIntent, limit: number): Promise<AffiliateProduct[]> => {
    if (!RAPIDAPI_KEY) return [];

    const keyword = intent.keywords.join(' ') || intent.rawQuery;
    if (!keyword.trim()) return [];

    try {
        const response = await axios.get<{ results?: FlipkartProduct[]; data?: FlipkartProduct[] }>(
            'https://flipkart-api7.p.rapidapi.com/product/search',
            {
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'flipkart-api7.p.rapidapi.com',
                },
                params: { q: keyword, page: 1 },
                timeout: 8000,
            },
        );
        const products: FlipkartProduct[] =
            response.data?.results ||
            response.data?.data ||
            [];

        logger.info(`Flipkart search (${keyword}): ${products.length} products`);
        return products.slice(0, limit).map(mapFlipkartProduct);
    } catch (err: unknown) {
        // Flipkart API subscription may not be active — silently skip
        const error = err as { response?: { status?: number } };
        if (error?.response?.status !== 403 && error?.response?.status !== 401) {
            logger.warn(`Flipkart RapidAPI skipped: ${error?.response?.status}`);
        }
        return [];
    }
};

// ─── Merge multi-store results ────────────────────────────────────────────────

/**
 * For products returned by both Amazon and Flipkart, merge store prices.
 * Matching is done by normalised product name similarity.
 */
const mergeStoreResults = (
    amazonProducts: AffiliateProduct[],
    flipkartProducts: AffiliateProduct[],
): AffiliateProduct[] => {
    const merged = [...amazonProducts];

    for (const fk of flipkartProducts) {
        const fkName = fk.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const fkWords = new Set(fkName.split(/\s+/).filter(w => w.length > 2));

        // Try to find a matching Amazon product (>50% word overlap)
        const match = merged.find(amz => {
            const amzName = amz.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
            const amzWords = amzName.split(/\s+/).filter(w => w.length > 2);
            const overlap = amzWords.filter(w => fkWords.has(w)).length;
            return amzWords.length > 0 && overlap / amzWords.length > 0.5;
        });

        if (match) {
            // Add Flipkart as an alternative store price
            match.storePrices.push(...fk.storePrices);
        } else {
            merged.push(fk);
        }
    }

    return merged;
};

// ─── Mock Fallback Pool ────────────────────────────────────────────────────────

const MOCK_POOL: AffiliateProduct[] = [
    {
        id: 'af_1', name: 'Nike Air Max 270 React', brand: 'Nike',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
        price: 6999, originalPrice: 12999, discount: 46, category: 'footwear',
        tags: ['nike', 'running shoes', 'sneakers', 'air max'],
        rating: 4.5, reviews: 3241, primaryStore: 'amazon',
        storePrices: [
            { storeId: 'amazon', storeName: 'Amazon India', price: 6999, inStock: true, affiliateUrl: 'https://amazon.in/s?k=nike+air+max+270', deliveryDays: 2 },
            { storeId: 'flipkart', storeName: 'Flipkart', price: 7499, inStock: true, affiliateUrl: 'https://flipkart.com/search?q=nike+air+max', deliveryDays: 3 },
        ],
        description: 'Nike Air Max 270 React with large Air unit for maximum cushioning.', isTrending: true,
        affiliateUrl: 'https://amazon.in/s?k=nike+air+max+270',
    },
    {
        id: 'af_2', name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        price: 24990, originalPrice: 34990, discount: 29, category: 'electronics',
        tags: ['headphones', 'wireless', 'anc', 'sony', 'noise cancelling'],
        rating: 4.8, reviews: 8910, primaryStore: 'amazon',
        storePrices: [
            { storeId: 'amazon', storeName: 'Amazon India', price: 24990, inStock: true, affiliateUrl: 'https://amazon.in/s?k=sony+wh1000xm5', deliveryDays: 1 },
            { storeId: 'flipkart', storeName: 'Flipkart', price: 25990, inStock: true, affiliateUrl: 'https://flipkart.com/search?q=sony+wh1000xm5', deliveryDays: 2 },
        ],
        description: 'Industry-leading noise canceling headphones with 30-hour battery.', isTrending: true,
        affiliateUrl: 'https://amazon.in/s?k=sony+wh1000xm5',
    },
    {
        id: 'af_3', name: 'boAt Rockerz 450 Bluetooth Headphones', brand: 'boAt',
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
        images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'],
        price: 1299, originalPrice: 3490, discount: 63, category: 'electronics',
        tags: ['headphones', 'wireless', 'bluetooth', 'boat', 'bass'],
        rating: 4.2, reviews: 52100, primaryStore: 'amazon',
        storePrices: [
            { storeId: 'amazon', storeName: 'Amazon India', price: 1299, inStock: true, affiliateUrl: 'https://amazon.in/s?k=boat+rockerz+450', deliveryDays: 1 },
            { storeId: 'flipkart', storeName: 'Flipkart', price: 1399, inStock: true, affiliateUrl: 'https://flipkart.com/search?q=boat+rockerz+450', deliveryDays: 2 },
        ],
        description: 'boAt Rockerz 450 with 15-hour playtime and 40mm drivers.',
        affiliateUrl: 'https://amazon.in/s?k=boat+rockerz+450',
    },
    {
        id: 'af_4', name: 'JBL Charge 5 Portable Bluetooth Speaker', brand: 'JBL',
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'],
        price: 9499, originalPrice: 14999, discount: 37, category: 'electronics',
        tags: ['speaker', 'bluetooth', 'waterproof', 'jbl', 'portable'],
        rating: 4.7, reviews: 21430, primaryStore: 'amazon',
        storePrices: [
            { storeId: 'amazon', storeName: 'Amazon India', price: 9499, inStock: true, affiliateUrl: 'https://amazon.in/s?k=jbl+charge+5', deliveryDays: 1 },
            { storeId: 'flipkart', storeName: 'Flipkart', price: 9999, inStock: true, affiliateUrl: 'https://flipkart.com/search?q=jbl+charge+5', deliveryDays: 2 },
        ],
        description: 'JBL Charge 5 with IP67 waterproofing, 20hr battery, and built-in power bank.', isTrending: true,
        affiliateUrl: 'https://amazon.in/s?k=jbl+charge+5',
    },
    {
        id: 'af_5', name: 'Samsung Galaxy Watch 6 Classic', brand: 'Samsung',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
        price: 22999, originalPrice: 29999, discount: 23, category: 'electronics',
        tags: ['smartwatch', 'samsung', 'fitness', 'galaxy watch'],
        rating: 4.4, reviews: 7230, primaryStore: 'amazon',
        storePrices: [
            { storeId: 'amazon', storeName: 'Amazon India', price: 22999, inStock: true, affiliateUrl: 'https://amazon.in/s?k=samsung+galaxy+watch+6', deliveryDays: 1 },
            { storeId: 'flipkart', storeName: 'Flipkart', price: 23999, inStock: true, affiliateUrl: 'https://flipkart.com/search?q=samsung+galaxy+watch+6', deliveryDays: 2 },
        ],
        description: 'Samsung Galaxy Watch 6 with advanced health monitoring and 40 hours battery.', isTrending: true,
        affiliateUrl: 'https://amazon.in/s?k=samsung+galaxy+watch+6',
    },
    {
        id: 'af_6', name: "Levi's 511 Slim Fit Jeans", brand: "Levi's",
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
        images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
        price: 1799, originalPrice: 3499, discount: 49, category: 'fashion',
        tags: ['jeans', 'slim fit', 'denim', 'levis', 'casual'],
        rating: 4.3, reviews: 9801, primaryStore: 'myntra',
        storePrices: [
            { storeId: 'myntra', storeName: 'Myntra', price: 1799, inStock: true, affiliateUrl: 'https://myntra.com/levis+511', deliveryDays: 4 },
            { storeId: 'amazon', storeName: 'Amazon India', price: 1999, inStock: true, affiliateUrl: 'https://amazon.in/s?k=levis+511+jeans', deliveryDays: 2 },
        ],
        description: "Levi's iconic 511 slim fit jeans in classic indigo with stretch comfort.",
        affiliateUrl: 'https://myntra.com/levis+511',
    },
    {
        id: 'af_7', name: 'Philips Air Fryer HD9252', brand: 'Philips',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
        images: ['https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400'],
        price: 7499, originalPrice: 11999, discount: 38, category: 'home',
        tags: ['air fryer', 'kitchen', 'philips', 'appliance', 'cooking'],
        rating: 4.5, reviews: 38100, primaryStore: 'amazon',
        storePrices: [
            { storeId: 'amazon', storeName: 'Amazon India', price: 7499, inStock: true, affiliateUrl: 'https://amazon.in/s?k=philips+air+fryer', deliveryDays: 2 },
            { storeId: 'flipkart', storeName: 'Flipkart', price: 7899, inStock: true, affiliateUrl: 'https://flipkart.com/search?q=philips+air+fryer', deliveryDays: 3 },
        ],
        description: '1.8kg rapid air technology fryer — up to 90% less fat than traditional frying.',
        affiliateUrl: 'https://amazon.in/s?k=philips+air+fryer',
    },
    {
        id: 'af_8', name: "L'Oreal Revitalift Face Serum", brand: "L'Oreal",
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'],
        price: 499, originalPrice: 899, discount: 44, category: 'beauty',
        tags: ['serum', 'skincare', 'loreal', 'anti-aging', 'face'],
        rating: 4.4, reviews: 18640, primaryStore: 'amazon',
        storePrices: [
            { storeId: 'amazon', storeName: 'Amazon India', price: 499, inStock: true, affiliateUrl: 'https://amazon.in/s?k=loreal+revitalift+serum', deliveryDays: 2 },
            { storeId: 'myntra', storeName: 'Myntra', price: 549, inStock: true, affiliateUrl: 'https://myntra.com/loreal+serum', deliveryDays: 3 },
        ],
        description: "L'Oreal 1.5% Pure Hyaluronic Acid serum for intense hydration.",
        affiliateUrl: 'https://amazon.in/s?k=loreal+revitalift+serum',
    },
];

const filterMockByIntent = (intent: SearchIntent): AffiliateProduct[] => {
    const keywordsLower = intent.keywords.map(k => k.toLowerCase());
    const rawLower = intent.rawQuery.toLowerCase();

    let results = MOCK_POOL.filter(p => {
        const text = `${p.name} ${p.brand} ${p.category} ${p.tags.join(' ')}`.toLowerCase();
        const matchesKw = keywordsLower.some(kw => text.includes(kw));
        const matchesRaw = rawLower.split(' ').some(w => w.length > 2 && text.includes(w));
        const matchesCat = intent.category ? p.category === intent.category : true;
        const matchesBrand = intent.brand ? p.brand.toLowerCase().includes(intent.brand.toLowerCase()) : true;
        return (matchesKw || matchesRaw) && matchesCat && matchesBrand;
    });

    if (intent.maxPrice) results = results.filter(p => p.price <= intent.maxPrice!);
    if (intent.minPrice) results = results.filter(p => p.price >= intent.minPrice!);

    return results.length > 0 ? results : MOCK_POOL.slice(0, 8);
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export const searchAffiliateProducts = async (
    intent: SearchIntent,
    limit = 20,
): Promise<AffiliateProduct[]> => {
    if (!RAPIDAPI_KEY) {
        logger.info('RAPIDAPI_KEY not configured — using AI-filtered mock data');
        return filterMockByIntent(intent).slice(0, limit);
    }

    // Fetch Amazon and Flipkart in parallel
    const [amazonResults, flipkartResults] = await Promise.all([
        searchAmazon(intent, limit),
        searchFlipkart(intent, Math.ceil(limit / 2)),
    ]);

    if (amazonResults.length === 0 && flipkartResults.length === 0) {
        logger.info('No real results from APIs — falling back to mock data');
        return filterMockByIntent(intent).slice(0, limit);
    }

    const merged = mergeStoreResults(amazonResults, flipkartResults);

    logger.info(`Merged results: ${merged.length} products (Amazon: ${amazonResults.length}, Flipkart: ${flipkartResults.length})`);
    return merged.slice(0, limit);
};
