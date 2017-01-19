var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var QuoteLoader = require('../QuoteLoader.js');
var quoteRepository = require('../QuoteRepository.js')(mongoFactory);
var quoteFetcher = require('../QuoteFetcher.js')();
var instrumentRepository = require('../InstrumentRepository.js')(mongoFactory);
var nasdaqQuoteFetcher = require('../NasdaqQuoteFetcher.js')({ 
    instrumentRepository: instrumentRepository 
});

/**
 * Fetches intraday quotes for some indices from yahoo.
 */
var quoteLoader = new QuoteLoader({
    quoteRepository: quoteRepository,
    quoteFetcher: quoteFetcher,
    nasdaqQuoteFetcher: nasdaqQuoteFetcher
});

var shutdown = function() {
    console.log('closing equity db');
    mongoFactory.closeEquityDb();
    process.exit(0);
};

quoteLoader.fetchIntradayQuotesFromYahoo(['^OMX','^OMXSPI'])
    .then(shutdown);
