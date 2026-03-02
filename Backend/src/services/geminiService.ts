import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

export interface SearchIntent {
    keywords: string[];
    category?: string;
    maxPrice?: number;
    minPrice?: number;
    brand?: string;
    rawQuery: string;
}

let genAI: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI | null => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!genAI) genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
};

/**
 * Parse a natural-language search query into structured intent using Gemini.
 * Falls back gracefully (returns raw query as keywords) if the key isn't set.
 */
export const parseSearchIntent = async (query: string): Promise<SearchIntent> => {
    const client = getClient();

    if (!client) {
        logger.warn('GEMINI_API_KEY not set — using raw query as keywords');
        return { keywords: query.split(' ').filter(Boolean), rawQuery: query };
    }

    try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are an e-commerce search assistant for an Indian shopping app. 
Analyze this search query and extract structured information.
Query: "${query}"

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "keywords": ["keyword1", "keyword2"],
  "category": "electronics|fashion|footwear|beauty|home|null",
  "maxPrice": <number or null>,
  "minPrice": <number or null>,
  "brand": "<brand name or null>"
}

Examples:
- "wireless headphones under 2000" → {"keywords":["wireless","headphones"],"category":"electronics","maxPrice":2000,"minPrice":null,"brand":null}
- "nike running shoes" → {"keywords":["running","shoes"],"category":"footwear","maxPrice":null,"minPrice":null,"brand":"nike"}
- "blue formal shirt size M" → {"keywords":["formal","shirt","blue"],"category":"fashion","maxPrice":null,"minPrice":null,"brand":null}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Strip any accidental markdown code fences
        const jsonStr = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(jsonStr);

        return {
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : query.split(' '),
            category: parsed.category && parsed.category !== 'null' ? parsed.category : undefined,
            maxPrice: parsed.maxPrice ?? undefined,
            minPrice: parsed.minPrice ?? undefined,
            brand: parsed.brand && parsed.brand !== 'null' ? parsed.brand : undefined,
            rawQuery: query,
        };
    } catch (err) {
        logger.error('Gemini parseSearchIntent failed, falling back to raw query', err);
        return { keywords: query.split(' ').filter(Boolean), rawQuery: query };
    }
};

/**
 * Analyze an image (base64) using Gemini Vision and return search-relevant keywords.
 */
export const analyzeImage = async (base64Data: string, mimeType: string): Promise<SearchIntent> => {
    const client = getClient();

    if (!client) {
        logger.warn('GEMINI_API_KEY not set — image search unavailable');
        return { keywords: ['product'], rawQuery: '[image search]' };
    }

    try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                },
            },
            `You are a product recognition AI for an Indian e-commerce app. 
Look at this image and identify the product(s) shown.
Respond ONLY with valid JSON (no markdown):
{
  "keywords": ["keyword1", "keyword2"],
  "category": "electronics|fashion|footwear|beauty|home|null",
  "brand": "<brand if visible or null>",
  "description": "<short product description>"
}`,
        ]);

        const text = result.response.text().trim();
        const jsonStr = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(jsonStr);

        return {
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : ['product'],
            category: parsed.category && parsed.category !== 'null' ? parsed.category : undefined,
            brand: parsed.brand && parsed.brand !== 'null' ? parsed.brand : undefined,
            rawQuery: parsed.description || '[image search]',
        };
    } catch (err) {
        logger.error('Gemini analyzeImage failed', err);
        return { keywords: ['product'], rawQuery: '[image search]' };
    }
};
