var test = require('tape');
var QuoteLoader = require('../../src/QuoteLoader.js');
var quoteFetcher = require('../../src/QuoteFetcher.js')();
var instrumentRepository = require('../../src/InstrumentRepository');
var mongoFactory = require('../../src/MongoFactory.js')({env: 'dev'});
var quoteRepository = require('../../src/QuoteRepository.js')(mongoFactory);
var testConf = require('../TestConf');

var nasdaqQuoteFetcher = require('../../src/NasdaqQuoteFetcher.js')({
    instrumentRepository: instrumentRepository
});


// INTEGRATION TEST
test('fetch daily from yahoo', { skip: testConf.skipIntegrationTest() }, function(t) {
    
    t.plan(2);

    var repositoryMock = {
        saveQuotes: function(quotes, callback) {
           t.ok(quotes['ERIC-B.ST'].length > 0, 'got quotes');  // first assert
           callback();
        }
    };

    var quoteLoader = new QuoteLoader({
        quoteRepository: repositoryMock,
        quoteFetcher: quoteFetcher,
        nasdaqQuoteFetcher: true
    });

    quoteLoader.fetchDaily(['ERIC-B.ST', 'SAS.ST'], new Date(2016,4,1), new Date(2016,5,1), function()  {
        t.pass('callback from fetch'); // second assert
    });

});

// MOCK DATA
test('fetch daily', function(t) {
    
    t.plan(3);

    var quoteFetcherMock = {
        fetchData: function(symbol, data, callback) {
            callback([{
                    symbol: 'eric',
                    date: '',
                    andsoon: 'lots of other fields'
            }]);
        }
    };

    var repositoryMock = {
        saveQuotes: function(quotes, callback) {
           t.ok(quotes['ERIC'], 'missing ERIC in quotes');
           t.ok(quotes['ERIC'].length > 0, 'got quotes');  // first assert
           callback(quotes);
        }
    };

    var quoteLoader = new QuoteLoader({
        quoteRepository: repositoryMock,
        quoteFetcher: quoteFetcher,
        nasdaqQuoteFetcher: true
    });

    quoteLoader.fetchDaily('ERIC', new Date(2016,0,1), new Date(2016,5,1), function()  {
        t.pass('callback from fetch'); // second assert

    });

});
