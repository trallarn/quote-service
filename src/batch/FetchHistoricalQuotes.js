var QuoteLoader = require('../QuoteLoader.js');
var quoteFetcher = require('../QuoteFetcher.js')();
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var quoteRepository = require('../QuoteRepository.js')(mongoFactory);
var instrumentRepository = require('../InstrumentRepository.js')(mongoFactory);

/**
 * @param index name
 * @param optional fromDate 
 */
function fetch(indexName, fromDate) {

    var quoteLoader = new QuoteLoader({
        quoteRepository: quoteRepository,
        quoteFetcher: quoteFetcher
    });

    console.log('fetching quotes for index: ' + indexName);

    instrumentRepository.getIndexAsync(indexName, function(index) {

        //console.dir(index);
        if(!index) {
            throw 'Got no index for name ' + indexName;
        }

        var from = fromDate || index.lastFetchDaily || new Date(1800,1,1);
        var to = new Date();
        var symbols = index.symbols;

        // CAPPING!!!!
        //symbols = symbols.slice(0, 2);

        //console.log('fetching quotes for symbols: ' + JSON.stringify(symbols));

        quoteLoader.fetchDaily(symbols, from, to, function(quotes)  {
            console.log('done saving quotes');
            instrumentRepository.saveIndexLastFetchDaily(index, to);
            mongoFactory.closeEquityDb();
        });

    });
}

//fetch('stockholm', new Date(1800,1,1));
fetch('stockholm');
//fetch('Indices', new Date(2016,5,29));
fetch('Indices');
