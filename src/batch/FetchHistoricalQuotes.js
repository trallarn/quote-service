var QuoteLoader = require('../QuoteLoader.js');
var quoteFetcher = require('../QuoteFetcher.js')();
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var quoteRepository = require('../QuoteRepository.js')(mongoFactory);
var instrumentRepository = require('../InstrumentRepository.js')(mongoFactory);

function fetch() {

    var quoteLoader = new QuoteLoader({
        quoteRepository: quoteRepository,
        quoteFetcher: quoteFetcher
    });

    var indexName = 'stockholm';

    console.log('fetching quotes for index: ' + indexName);

    instrumentRepository.getIndexAsync(indexName, function(index) {

        //console.dir(index);
        if(!index) {
            throw 'Got no index for name ' + indexName;
        }

        var from = index.lastFetchDaily || new Date(1800,1,1);
        var to = new Date();
        var symbols = index.symbols;

        // CAPPING!!!!
        symbols = symbols.slice(0, 2);

        //console.log('fetching quotes for symbols: ' + JSON.stringify(symbols));

        quoteLoader.fetchDaily(symbols, from, to, function(quotes)  {
            console.log('done saving quotes');
            //console.dir(quotes);
            instrumentRepository.saveIndexLastFetchDaily(index, to);
            mongoFactory.closeEquityDb();
        });

    });
}

fetch();
