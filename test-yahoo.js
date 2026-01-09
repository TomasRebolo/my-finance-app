const yahooFinance = require('yahoo-finance2').default;

async function checkStock() {
    try {
        const symbol = 'IUSP.L';
        const quote = await yahooFinance.quote(symbol);

        console.log('--- Yahoo Finance Data for ' + symbol + ' ---');
        console.log('Price:', quote.regularMarketPrice);
        console.log('Currency:', quote.currency);
        console.log('Exchange:', quote.exchange);
        console.log('Full Quote:', JSON.stringify(quote, null, 2));
    } catch (error) {
        console.error('Error fetching quote:', error);
    }
}

checkStock();
