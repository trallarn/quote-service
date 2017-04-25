/**
 * Script that adjust quotes for splits.
 * Run without args for flags.
 */

var _ = require('underscore');
var Promise = require('promise');
var CorporateActionsRepository = require('../CorporateActionsRepository');
var QuoteRepository = require('../QuoteRepository.js');
var CorporateActionsService = require('../service/CorporateActionsService.js');
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var instrumentRepository = require('../InstrumentRepository.js')(mongoFactory);

function shutdown() {
    mongoFactory.closeEquityDb();
}

function printHelpAndExit() {
    console.log(`
    This scripts adjusts quotes for splits. 
    Run with: 
    ${process.argv[1]} < --symbols|--reset <symbol,symbol,...> | --index <index>>
    `);
    process.exit(0);
}

function adjustForSplits(symbols, corporateActionsFromDB) {
    return corporateActionsService.getSymbolsWithLargeGaps(symbols)
        .then(_quotes => _quotes.map(q => q.symbol))
        .then(_symbols => {
            if(corporateActionsFromDB) {
                console.log('Using corporate actions from DB');
                return _symbols;
            } else {
                // Fetch from API
                console.log('Fetching corporate actions from API.');
                return corporateActionsRepository.getFromAPIAndSaveToDB(symbols)
                    .catch(e => console.error(e.name, e.message.slice(0, 20)))
                    .then(() => _symbols);
            }
        })
        .then(_symbols => {
            console.log(`Adjusting ${_symbols.length} symbols`);
            return _symbols;
        })
        .then(_symbols => {
            return _symbols.map(symbol => {
                return corporateActionsService.adjustDailyForSplits(symbol)
                    .then(function(ret) {
                        console.log('Adjusted ' + symbol + ' for splits');
                    })
                    .catch(function(err) {
                        console.log('', err, err.stack);
                    });
            });
        })
        .then(Promise.all)
        .finally(shutdown);
}

function resetQuotes(symbols) {
    console.log('Resetting quotes for ' + symbols);
    corporateActionsService.resetQuotesToOrigForSymbols(symbols)
        .catch(e => console.error(e.message, e.stack))
        .finally(shutdown);
}

const corporateActionsRepository = new CorporateActionsRepository({
    mongoFactory: mongoFactory
});

const corporateActionsService = new CorporateActionsService({
    corporateActionsRepository: corporateActionsRepository,
    quoteRepository: new QuoteRepository(mongoFactory),
});

const flag = process.argv[2];
const param = process.argv[3];
const corporateActionsFromDB = process.argv.indexOf('--fromDB') > -1;

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
            .then(_symbols => adjustForSplits(_symbols, corporateActionsFromDB))
            .catch(e => console.error(e.message, e.stack))
            .finally(shutdown);
        break;

    case '--symbols':
        const symbols = param.split(',');
        adjustForSplits(symbols, corporateActionsFromDB)
        break;

    default:
        printHelpAndExit();
}
