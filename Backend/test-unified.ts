import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const testUnifiedSearch = async () => {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

    try {
        const response = await axios.get(
            `https://real-time-product-search.p.rapidapi.com/search-v2`,
            {
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'real-time-product-search.p.rapidapi.com',
                },
                params: {
                    q: 'Nike shoes',
                    country: 'in',
                    language: 'en',
                    page: '1',
                    limit: '10',
                    sort_by: 'BEST_MATCH'
                },
                timeout: 15000,
            },
        );
        console.log('--- SUCCESS ---');
        console.log('Data keys:', Object.keys(response.data.data));
        if (response.data.data.products) {
            console.log('Products array length:', response.data.data.products.length);
            if (response.data.data.products.length > 0) {
                const p = response.data.data.products[0];
                console.log('First Product Keys:', Object.keys(p));
                console.log('First Product Sample:', {
                    title: p.product_title,
                    price: p.product_price,
                    store: p.offer?.store_name || p.offer?.store_id || 'unknown'
                });
                if (p.offer) {
                    console.log('Offer Keys:', Object.keys(p.offer));
                }
            }
        }
    } catch (err: any) {
        console.error('--- ERROR ---', err.response?.status, err.response?.data || err.message);
    }
};

testUnifiedSearch();
