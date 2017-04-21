var _ = require('underscore');
var Promise = require('promise');
var CorporateActionsRepository = require('../CorporateActionsRepository');
var QuoteRepository = require('../QuoteRepository.js');
var CorporateActionsService = require('../service/CorporateActionsService.js');
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var instrumentRepository = require('../InstrumentRepository.js')(mongoFactory);

function shutdown() {
    mongoFactory.closeEquityDb();
    // Shouldn't need to exit but the process hangs otherwise. Some db-connetction hanging?
    //process.exit(0);
}

const corporateActionsRepository = new CorporateActionsRepository({
    mongoFactory: mongoFactory
});

const corporateActionsService = new CorporateActionsService({
    corporateActionsRepository: corporateActionsRepository,
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

function printHelpAndExit() {
    console.log(process.argv[1] + ' <--symbols <symbol,symbol,...> | --index <index>>');
    process.exit(0);
}

function adjustForSplits(symbols) {
    return corporateActionsRepository.getFromAPIAndSaveToDB(symbols)
        .catch(e => console.error(e.name, e.message.slice(0, 20)))
        .then(_res => {
            return Promise.all(symbols.map(symbol => {
                return corporateActionsService.adjustDailyForSplits(symbol)
                    .then(function(ret) {
                        console.log('adjusted ' + symbol + ' for splits');
                    })
                    .catch(function(err) {
                        console.log('', err, err.stack);
                    });
            }))
        })
        .finally(shutdown);
}

function resetQuotes(symbols) {
    console.log('Resetting quotes for ' + symbols);
    corporateActionsService.resetQuotesToOrigForSymbols(symbols)
        .catch(e => console.error(e.message, e.stack))
        .finally(shutdown);
}

const flag = process.argv[2];
const param = process.argv[3];

if(!param || param.length === 0) {
    printHelpAndExit();
}

switch(flag) {
    case '--reset':
        resetQuotes(param.split(','));
        break;
    case '--index':
        const index = param;
        instrumentRepository.getIndexComponents(index)
            .then(_components => _components.map(_component => _component.symbol))
            .then(_symbols => adjustForSplits(_symbols))
            .catch(e => console.error(e.message, e.stack))
            .finally(shutdown);
        break;

    case '--symbols':
        const symbols = param.split(',');
        adjustForSplits(symbols)
        break;

    default:
        printHelpAndExit();
}
