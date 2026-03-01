export interface Category {
    id: string;
    label: string;
    icon: string;
    color: string;
}

export const mockCategories: Category[] = [
    { id: 'all', label: 'All', icon: '✨', color: '#6C63FF' },
    { id: 'fashion', label: 'Fashion', icon: '👗', color: '#FF3F6C' },
    { id: 'electronics', label: 'Electronics', icon: '📱', color: '#29B6F6' },
    { id: 'footwear', label: 'Footwear', icon: '👟', color: '#FFB74D' },
    { id: 'home', label: 'Home', icon: '🏠', color: '#4CAF82' },
    { id: 'beauty', label: 'Beauty', icon: '💄', color: '#FF6584' },
    { id: 'sports', label: 'Sports', icon: '⚽', color: '#43A047' },
    { id: 'books', label: 'Books', icon: '📚', color: '#F4511E' },
    { id: 'toys', label: 'Toys', icon: '🧸', color: '#AB47BC' },
    { id: 'grocery', label: 'Grocery', icon: '🥦', color: '#26A69A' },
];
