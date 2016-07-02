var _ = require('underscore');
var QuoteLoader = require('../QuoteLoader.js');
var quoteFetcher = require('../QuoteFetcher.js')();
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var quoteRepository = require('../QuoteRepository.js')(mongoFactory);
var instrumentRepository = require('../InstrumentRepository.js')(mongoFactory);

var quoteLoader = new QuoteLoader({
    quoteRepository: quoteRepository,
    quoteFetcher: quoteFetcher
});

/**
 * @param index name
 * @param optional fromDate 
 */
function fetch(indexName, fromDate) {

    console.log('fetching quotes for index: ' + indexName);

    instrumentRepository.getIndexAsync(indexName, function(index) {

        //console.dir(index);
        if(!index) {
            throw 'Got no index for name ' + indexName;
        }

        var from = fromDate || index.lastFetchDaily;
        var to = new Date();
        var symbols = index.symbols;

        // CAPPING!!!!
        //symbols = symbols.slice(0, 2);

        //console.log('fetching quotes for symbols: ' + JSON.stringify(symbols));

        fetchForSymbols(symbols, from, to, function() {
            instrumentRepository.saveIndexLastFetchDaily(index, to);
        });
    });
}

/**
 * @param symbols <[symbol]|symbol>
 */
function fetchForSymbols(symbols, from, to, callback) {
    symbols = _.isArray(symbols) ? symbols : [symbols];
    var from = from || new Date(1800,1,1);
    var to = to || new Date();
    debugger;

    quoteLoader.fetchDaily(symbols, from, to, function(quotes)  {
        console.log('done saving quotes');
        
        //console.dir(quotes);
        if(callback) {
            callback();
        }

    });

}

function getNumDaysBefore(date, numDays) {
    var before = new Date(date.getTime());
    before.setTime(date.getTime() - numDays * 24 * 3600 * 1000);
    return before;
}

//fetch('stockholm', new Date(1800,1,1));
fetch('stockholm');
//fetch('Indices', new Date(2016,5,29));
fetch('Indices');
// Shut down when all done
//mongoFactory.closeEquityDb();


//var today = new Date(2016, 6, 1);
//var yesterday = getNumDaysBefore(today, 1);
//fetchForSymbols(['^OMXSPI'], today, today);

