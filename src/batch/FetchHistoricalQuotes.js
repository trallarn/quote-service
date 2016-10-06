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
function fetch(indexName, fromDate, callback) {

    console.log('fetching quotes for index: ' + indexName);

    instrumentRepository.getIndexAsync(indexName, function(index) {

        //console.dir(index);
        if(!index) {
            throw 'Got no index for name ' + indexName;
        }

        var from; 
        
        if(fromDate) {
            from = fromDate;
        } else {
            // Fetch a few days back in history
            if(index.lastFetchDaily) {
                from = getNumDaysBefore(index.lastFetchDaily, 4);
            } else {
                from = new Date(1900,1,1);
            }
        }

        var to = new Date();
        var symbols = index.symbols;

        // CAPPING!!!!
        //symbols = symbols.slice(0, 2);

        //console.log('fetching quotes for symbols: ' + JSON.stringify(symbols));

        fetchForSymbols(symbols, from, to, function() {
            instrumentRepository.saveIndexLastFetchDaily(index, to);

            if(callback) {
                callback();
            }
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

    quoteLoader.fetchDaily(symbols, from, to, function(quotes)  {
        console.log('done saving quotes');
        
        //console.dir(quotes);
        if(callback) {
            callback();
        }

    });

}

function shutdown() {
    // Give db chance to finish its operations
    //setTimeout(function() {
    //}, 5000);
    mongoFactory.closeEquityDb();
}

function getNumDaysBefore(date, numDays) {
    var before = new Date(date.getTime());
    before.setTime(date.getTime() - numDays * 24 * 3600 * 1000);
    return before;
}


function runJobs() {

    var jobs = [
        //['stockholm', new Date(1800,1,1)],
        //['Indices', new Date(1800,1,1)]
        //['Currencies', new Date(1800,1,1)]
        //['Commodities', new Date(1800,1,1)]
        ['stockholm'],
        ['Currencies'],
        ['Commodities'],
        ['Indices']
    ];

    var jobMem = { count: 0, stopAt: jobs.length };

    _.each(jobs, function(job) {
        fetch(job[0], job[1], function() {
            jobMem.count++;

            if(jobMem.count === jobMem.stopAt) {
                console.log('Job count reached. Shutting down.');
                setTimeout(shutdown, 2000); // small delay to let last operations finish (TODO: add callbacks instead of using delay)
            }
        });
    });
}

runJobs();


//var endDate = new Date(2016, 6, 1);
var endDate = new Date();
//var startDate = getNumDaysBefore(endDate, 3);
var startDate = new  Date(1900,1,1);
//fetchForSymbols(['^OMXSPI','^DJI','^GSPC'], startDate, endDate, shutdown);
//fetchForSymbols(['^OMXSPI'], startDate, endDate, shutdown);
//fetchForSymbols(['IS.ST','KABE-B.ST'], startDate, endDate, shutdown);

