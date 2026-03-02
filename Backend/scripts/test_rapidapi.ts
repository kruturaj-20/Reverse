import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

async function testLiveStores() {
    console.log('\n=============================================');
    console.log('  🌐 FETCHING LIVE STORE DATA (NO MOCKS) 🌐  ');
    console.log('=============================================\n');

    if (!RAPIDAPI_KEY) {
        console.error('❌ Error: RAPIDAPI_KEY is not defined in .env');
        return;
    }

    const query = 'smartwatch';

    // 1. Test Amazon Live API
    console.log(`📡 Fetching from Amazon (Query: "${query}")...`);
    try {
        const amzRes = await axios.get('https://real-time-amazon-data.p.rapidapi.com/search', {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
            },
            params: { query, page: '1', country: 'IN', sort_by: 'RELEVANCE' }
        });

        const amzProducts = (amzRes.data as any)?.data?.products || (amzRes.data as any)?.products || [];
        console.log(`✅ Success! Found ${amzProducts.length} live Amazon products.`);
        if (amzProducts.length > 0) {
            console.log(`   🔸 Top result: ${amzProducts[0].product_title.substring(0, 60)}...`);
            console.log(`   🔸 Price: ${amzProducts[0].product_price}`);
            console.log(`   🔸 URL: ${amzProducts[0].product_url}\n`);
        } else {
            console.log('   ⚠️ WARNING: Received 0 products. Your RapidAPI key is valid but the endpoint returned empty data. Check your RapidAPI quota or subscription limits.\n');
        }
    } catch (e: any) {
        console.error(`❌ Amazon API Failed: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}\n`);
    }

    // 2. Test Flipkart Live API
    console.log(`📡 Fetching from Flipkart (Query: "${query}")...`);
    try {
        const fpRes = await axios.get('https://flipkart-api7.p.rapidapi.com/product/search', {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'flipkart-api7.p.rapidapi.com',
            },
            params: { q: query, page: 1 }
        });

        const fpProducts = (fpRes.data as any)?.results || (fpRes.data as any)?.data || [];
        console.log(`✅ Success! Found ${fpProducts.length} live Flipkart products.`);
        if (fpProducts.length > 0) {
            console.log(`   🔸 Top result: ${fpProducts[0].title.substring(0, 60)}...`);
            console.log(`   🔸 Price: ₹${fpProducts[0].price}`);
            console.log(`   🔸 URL: ${fpProducts[0].url}\n`);
        } else {
            console.log('   ⚠️ WARNING: Received 0 products from Flipkart API.\n');
        }
    } catch (e: any) {
        console.error(`❌ Flipkart API Failed: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}\n`);
    }
}

testLiveStores();
