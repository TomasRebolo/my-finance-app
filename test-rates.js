const yahooFinance = require('yahoo-finance2').default;

(async () => {
    const pairs = ["EURUSD=X", "USDEUR=X", "GBPUSD=X", "USDGBP=X", "EURGBP=X", "GBPEUR=X"];
    try {
        const results = await yahooFinance.quote(pairs);
        const quotes = Array.isArray(results) ? results : [results];
        quotes.forEach(q => {
            console.log(`${q.symbol}: ${q.regularMarketPrice}`);
        });
    } catch (e) {
        console.error(e);
    }
})();
