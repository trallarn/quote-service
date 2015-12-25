var mongoFactory = require('./MongoFactory.js')();
var fetcher = require('./QuoteFetcher.js')();
var fs = require('fs');
var quoteRepository = require('./QuoteRepository.js')(mongoFactory);

var symbol = 'ERIC';

fetcher.fetchData(symbol, 2015, 11, 1, 2015, 12, 1, function(data) {

    //console.dir(arguments);

    if(!data) {
        throw 'Data is empty';
    }
        
    quoteRepository.saveQuotes(data, function(){
        console.log('saved quotes for ' + symbol);
        mongoFactory.closeEquityDb();
    });
     
});
