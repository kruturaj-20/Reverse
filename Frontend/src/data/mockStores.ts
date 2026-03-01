export interface Store {
    id: string;
    name: string;
    color: string;
    logo: string;
    baseUrl: string;
}

export const mockStores: Store[] = [
    { id: 'amazon', name: 'Amazon', color: '#FF9900', logo: '🛒', baseUrl: 'https://amazon.in' },
    { id: 'flipkart', name: 'Flipkart', color: '#2874F0', logo: '🏪', baseUrl: 'https://flipkart.com' },
    { id: 'myntra', name: 'Myntra', color: '#FF3F6C', logo: '👗', baseUrl: 'https://myntra.com' },
    { id: 'meesho', name: 'Meesho', color: '#9B26B9', logo: '🛍️', baseUrl: 'https://meesho.com' },
    { id: 'ajio', name: 'AJIO', color: '#E91E63', logo: '👔', baseUrl: 'https://ajio.com' },
    { id: 'snapdeal', name: 'Snapdeal', color: '#E40046', logo: '🔖', baseUrl: 'https://snapdeal.com' },
];

export const getStoreById = (id: string): Store | undefined =>
    mockStores.find(s => s.id === id);
