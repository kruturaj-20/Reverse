import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const testFlipkartCategory = async () => {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

    // Based on the user's earlier screenshot, "Category List" is a feature.
    // The previous test got a 404. Let's try another variation.
    console.log(`\nTesting: https://real-time-flipkart-data2.p.rapidapi.com/categories-list`);
    try {
        const responseList = await axios.get(
            `https://real-time-flipkart-data2.p.rapidapi.com/categories-list`,
            {
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'real-time-flipkart-data2.p.rapidapi.com',
                },
                timeout: 10000,
            },
        );
        console.log('--- SUCCESS (Category List) ---');
        console.log('Keys:', Object.keys(responseList.data));
    } catch (err: any) {
        console.error('--- ERROR (Category List) ---', err.response?.status, err.response?.data || err.message);
    }

    // Try the actual products-by-category endpoint with a 15s timeout
    console.log(`\nTesting: https://real-time-flipkart-data2.p.rapidapi.com/products-by-category`);
    try {
        const response = await axios.get(
            `https://real-time-flipkart-data2.p.rapidapi.com/products-by-category`,
            {
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'real-time-flipkart-data2.p.rapidapi.com',
                },
                params: {
                    categoryId: 'tyy,4io',
                    page: '1',
                    sortBy: 'POPULARITY'
                },
                timeout: 15000,
            },
        );
        console.log('--- SUCCESS (Products by Category) ---');
        if (response.data.data && Array.isArray(response.data.data)) {
            console.log('Got', response.data.data.length, 'products');
            if (response.data.data.length > 0) {
                console.log('First product keys:', Object.keys(response.data.data[0]));
                console.log('Sample:', {
                    title: response.data.data[0].title,
                    price: response.data.data[0].price,
                    product_id: response.data.data[0].product_id
                });
            }
        } else {
            console.log('Data keys:', Object.keys(response.data));
            console.log(response.data);
        }
    } catch (err: any) {
        console.error('--- ERROR (Products by Category) ---', err.response?.status, err.response?.data || err.message);
    }
};

testFlipkartCategory();
