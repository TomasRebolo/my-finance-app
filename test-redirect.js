const { Snaptrade } = require('snaptrade-typescript-sdk');

const client = new Snaptrade({
    consumerKey: 'test',
    clientId: 'test',
});

// Test what the loginSnapTradeUser response looks like
async function testLogin() {
    try {
        const response = await client.authentication.loginSnapTradeUser({
            userId: 'test123',
            userSecret: 'secret123',
        });
        console.log('Response keys:', Object.keys(response));
        console.log('Response.data keys:', Object.keys(response.data || {}));
    } catch (error) {
        if (error.response && error.response.data) {
            console.log('Error response structure:', Object.keys(error.response.data));
        }
        console.log('Expected - this will fail with 401');
    }
}

testLogin();
