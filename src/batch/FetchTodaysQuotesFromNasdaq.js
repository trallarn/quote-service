/**
 * Fetches current last quote and volume from nasdaq page.
 */
var _ = require('underscore');
var Promise = require('promise');

var QuoteLoader = require('../QuoteLoader.js');
var quoteFetcher = require('../QuoteFetcher.js')();
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var instrumentRepository = require('../InstrumentRepository.js')(mongoFactory);
var nasdaqQuoteFetcher = require('../NasdaqQuoteFetcher.js')({ 
    instrumentRepository: instrumentRepository 
});
var quoteRepository = require('../QuoteRepository.js')(mongoFactory);

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

var indexIsins = [
    'SE0001775784', // sth l cap
    'SE0001775800', // sth m cap
    'SE0001775891'  // sth s  cap
];

var promises = _.map(indexIsins, function(isin) {
    return quoteLoader.fetchTodaysQuotesFromNasdaqIndex(isin);
});

Promise.all(promises)
    .then(shutdown)
    .catch(function(err) {
        console.log('error with msg ' + err);
        throw err;
    });
