var _ = require('underscore');
var CorporateActionsRepository = require('../CorporateActionsRepository');
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});

function shutdown() {
    console.log('closing equity db');
    mongoFactory.closeEquityDb();
    // Shouldn't need to exit but the process hangs otherwise. Some db-connetction hanging?
    process.exit(0);
}

function printUsageAndExit() {
    console.log('usage: node ' + process.argv[1] + ' <startdate> <enddate> <symbol,symbol,...>');
    process.exit(0);
}

var corporateActionsRepository = new CorporateActionsRepository({
    mongoFactory: mongoFactory
});

var startDateParam = process.argv[2];
var endDateParam = process.argv[3];

var startDate = startDateParam ? new Date(startDateParam) : false;
var endDate = endDateParam ? new Date(endDateParam) : false;

if(!(startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()))) {
    printUsageAndExit();
}

var symbolsParam = process.argv[4];

if(!symbolsParam || symbolsParam.length === 0) {
    printUsageAndExit();
}

var symbols = symbolsParam.split(',');

symbols.forEach(function(symbol) {
    corporateActionsRepository.getFromAPI(symbol, startDate, endDate)
        .then(corporateActionsRepository.saveToDB.bind(corporateActionsRepository))
        .then(shutdown)
        .catch(function(err) {
            console.log('got error', err);
            shutdown();
        });
});
