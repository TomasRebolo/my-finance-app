// Test script to check the actual response structure
const { Snaptrade } = require('snaptrade-typescript-sdk');

async function testResponseStructure() {
    const client = new Snaptrade({
        consumerKey: process.env.SNAPTRADE_CONSUMER_KEY || 'test',
        clientId: process.env.SNAPTRADE_CLIENT_ID || 'test',
    });

    try {
        const response = await client.authentication.loginSnapTradeUser({
            userId: 'test',
            userSecret: 'test',
        });

        console.log('Success! Response structure:');
        console.log('response keys:', Object.keys(response));
        console.log('response.data keys:', Object.keys(response.data));
        console.log('response.data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('\nExpected error (401). Checking error structure:');
        if (error.response) {
            console.log('error.response.status:', error.response.status);
            console.log('error.response.data:', JSON.stringify(error.response.data, null, 2));
        }

        // The important part: what would a successful response look like?
        console.log('\nBased on TypeScript types, checking what properties exist...');
        console.log('The response type is: AuthenticationLoginSnapTradeUser200Response');
        console.log('Which is a union of: EncryptedResponse | LoginRedirectURI');
    }
}

// Load dotenv if available
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not required for this test
}

testResponseStructure();
