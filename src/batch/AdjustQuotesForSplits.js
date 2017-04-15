var _ = require('underscore');
var Promise = require('promise');
var CorporateActionsRepository = require('../CorporateActionsRepository');
var QuoteRepository = require('../QuoteRepository.js');
var CorporateActionsService = require('../CorporateActionsService.js');
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});

function shutdown() {
    console.log('closing equity db');
    mongoFactory.closeEquityDb();
    // Shouldn't need to exit but the process hangs otherwise. Some db-connetction hanging?
    process.exit(0);
}

var corporateActionsService = new CorporateActionsService({
    corporateActionsRepository: new CorporateActionsRepository({
        mongoFactory: mongoFactory
    }),
    quoteRepository: new QuoteRepository(mongoFactory),
});

//var startDateParam = process.argv[2];
//var endDateParam = process.argv[3];
//
//var startDate = startDateParam ? new Date(startDateParam) : false;
//var endDate = endDateParam ? new Date(endDateParam) : false;

//if(!(startDate && endDate)) {
//    console.log('usage: node ' + process.argv[1] + ' <startdate> <enddate>');
//}

var symbolsParam = process.argv[2];

if(!symbolsParam || symbolsParam.length === 0) {
    console.log(process.argv[1] + ' <symbol,symbol,...>');
    process.exit(0);
}

//TODO Get real symbols
var symbols = symbolsParam.split(',');

Promise.all(symbols.map(function(symbol) {
    return corporateActionsService.adjustDailyForSplits(symbol)
        .then(function(ret) {
            console.log('adjusted ' + symbol + ' for splits');
        })
        .catch(function(err) {
            console.log('', err, err.stack);
        });
})).finally(shutdown);
