var test = require('tape');
var QuoteLoader = require('../src/QuoteLoader.js');
var quoteFetcher = require('../src/QuoteFetcher.js')();
//var mongoFactory = require('./MongoFactory.js')();
//var quoteRepository = require('./QuoteRepository.js')(mongoFactory);

test('fetch daily', function(t) {
    
    t.plan(2);

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
           t.ok(quotes.length > 0, 'got quotes');  // first assert
           callback();
        }
    };

    var quoteLoader = new QuoteLoader({
        quoteRepository: repositoryMock,
        quoteFetcher: quoteFetcher
    });

    quoteLoader.fetchDaily('ERIC', new Date(2016,0,1), new Date(2016,5,1), function()  {
        t.pass('callback from fetch'); // second assert

    });

});
