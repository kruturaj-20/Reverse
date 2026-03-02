import { analyzeImage } from './geminiService';
import { searchAffiliateProducts, AffiliateProduct } from './affiliateService';
import logger from '../utils/logger';

/**
 * Full image search pipeline:
 * 1. Convert image buffer to base64
 * 2. Gemini Vision analyses → keywords + category + brand
 * 3. Affiliate product search using those keywords
 */
export const processImageSearch = async (
    imageBuffer: Buffer,
    mimeType: string,
): Promise<{ products: AffiliateProduct[]; detectedQuery: string }> => {
    try {
        const base64Data = imageBuffer.toString('base64');
        const intent = await analyzeImage(base64Data, mimeType);

        logger.info(`Image analyzed — detected: "${intent.rawQuery}", keywords: [${intent.keywords.join(', ')}]`);

        const products = await searchAffiliateProducts(intent, 12);

        return {
            products,
            detectedQuery: intent.rawQuery,
        };
    } catch (err) {
        logger.error('Image search pipeline failed', err);
        return { products: [], detectedQuery: 'product' };
    }
};
