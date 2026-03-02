import { apiClient } from './apiClient';
import { Product } from '../data/mockProducts';

export interface AiSearchMeta {
    query: string;
    detectedCategory?: string;
    detectedBrand?: string;
    maxPrice?: number;
}

export interface SearchResponse {
    data: Product[];
    meta?: AiSearchMeta;
}

/**
 * Text-based AI search — calls GET /api/v1/search?q=...
 * Returns real affiliate products processed by Gemini + CueLinks.
 */
export const textSearch = async (
    query: string,
    options?: {
        page?: number;
        limit?: number;
        category?: string;
        brand?: string;
        maxPrice?: number;
        minPrice?: number;
        sort?: string;
    },
): Promise<SearchResponse> => {
    const params: Record<string, string | number | undefined> = {
        q: query,
        page: options?.page ?? 1,
        limit: options?.limit ?? 20,
        category: options?.category,
        brand: options?.brand,
        maxPrice: options?.maxPrice,
        minPrice: options?.minPrice,
    };

    // Remove undefined params
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    const response = await apiClient.get<{ success: boolean; data: Product[]; message: string }>('/search', { params });
    return { data: response.data.data ?? [], meta: { query } };
};

/**
 * Image-based AI search — calls POST /api/v1/search/image
 * Uploads the image as multipart/form-data, returns affiliate products.
 */
export const imageSearch = async (
    imageUri: string,
    mimeType: string = 'image/jpeg',
): Promise<SearchResponse> => {
    const formData = new FormData();

    // React Native FormData requires this shape for file upload
    formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: `search_image.${mimeType.split('/')[1] || 'jpg'}`,
    } as unknown as Blob);

    const response = await apiClient.post<{ success: boolean; data: Product[]; message: string }>(
        '/search/image',
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000, // Vision AI can be slow
        },
    );

    return { data: response.data.data ?? [], meta: { query: '[image search]' } };
};
