// @ts-ignore
import axios from 'axios';
// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';

const API_URL = 'http://localhost:5000/api/v1';

async function verifyFeatures() {
    console.log('\n=============================================');
    console.log('  🧪 VERIFYING AI SEARCH ENGINE FEATURES 🧪');
    console.log('=============================================\n');

    try {
        // --- TEXT SEARCH (Verifies Gemini, RapidAPI Amazon/Flipkart, Multi-Store, Affiliate Links) ---
        console.log('Testing Query: "wireless headphones under 2000"');
        console.log('Sending request to /search endpoint...\n');

        const res = await axios.get(`${API_URL}/search?q=wireless headphones under 2000`);
        const responseData = res.data as any;
        const { data, message, aiMeta } = responseData;

        // 1. Verify Gemini Parsing
        console.log('✅ 1. text search parsed by Gemini:');
        console.log('   Message returned from backend:', message);
        console.log('   Expected backend to understand "under 2000". AI Meta:', JSON.stringify(aiMeta, null, 2));

        if (data.length === 0) {
            console.log('\n❌ No products returned.');
            return;
        }

        console.log(`\nReturned ${data.length} products.`);

        // 2 & 3 & 4. Verify RapidAPI, Multi-Store, Price Merging
        let hasAmazon = false;
        let hasFlipkart = false;
        let hasMultiStore = false;
        const firstMultiStoreProduct = Object.values(data).find((p: any) => p.storePrices && p.storePrices.length > 1);

        data.slice(0, 3).forEach((p: any, i: number) => {
            console.log(`\n📦 Product ${i + 1}: ${p.name.substring(0, 50)}... (${p.brand})`);
            console.log(`   Price: ₹${p.price}`);

            p.storePrices.forEach((store: any) => {
                console.log(`   🔸 Store: ${store.storeName} - ₹${store.price}`);
                console.log(`      Affiliate Link: ${store.affiliateUrl}`);
                if (store.storeId === 'amazon') hasAmazon = true;
                if (store.storeId === 'flipkart') hasFlipkart = true;
            });
            if (p.storePrices.length > 1) hasMultiStore = true;
        });

        console.log('\n✅ 2 & 3. Real Products (RapidAPI fetched):');
        console.log(`   Amazon products found: ${hasAmazon ? 'Yes' : 'No'}`);
        console.log(`   Flipkart products found: ${hasFlipkart ? 'Yes' : 'No'}`);

        console.log('\n✅ 4. Multi-Store Merging:');
        console.log(`   Products with prices from multiple stores found: ${hasMultiStore ? 'Yes' : 'No'}`);
        if (firstMultiStoreProduct) {
            console.log(`   Example merged product: ${(firstMultiStoreProduct as any).name.substring(0, 60)}...`);
        }

        console.log('\n✅ 5. Valid Affiliate Links:');
        const sampleUrl = data[0].storePrices[0].affiliateUrl;
        console.log(`   Sample real link: ${sampleUrl}`);
        console.log(`   Does it start with http?: ${sampleUrl.startsWith('http') ? 'Yes' : 'No'}`);

    } catch (e: any) {
        console.error('❌ Error during testing:', e.response?.data || e.message);
    }
}

verifyFeatures();
