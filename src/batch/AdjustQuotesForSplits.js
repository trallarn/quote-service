/**
 * Script that adjust quotes for splits.
 * Run without args for flags.
 */

var _ = require('underscore');
var Promise = require('bluebird');
var InstrumentRepository = require('../InstrumentRepository.js');
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
    ${process.argv[1]} < --symbols|--reset <symbol,symbol,...> | --indices <index,index,...>> --skipLastAdjustmentCheck --fromDB
    `);
    process.exit(0);
}

/**
 * Filters instruments with adjustment date older than a certain time.
 */
function filterInstrumentsNotRecentlyAdjusted(skipLastAdjustmentCheck, instruments) { 
    if(skipLastAdjustmentCheck === true) {
        console.log('Skipping last adjustment check');
        return instruments;
    }

    const splitsCompareTime = Date.now() - 60 * 24 * 3600 * 1000;

    return instruments.filter(_instr => {
        return !_instr.splitAdjustmentTS || _instr.splitAdjustmentTS.getTime() < splitsCompareTime;
    });
}

function adjustForSplits(symbols, corporateActionsFromDB, skipLastAdjustmentCheck) {
    return instrumentRepository.getInstrumentsBySymbols(symbols)
        .then(filterInstrumentsNotRecentlyAdjusted.bind(this, skipLastAdjustmentCheck))
        .then(_instruments => _instruments.map(_instr => _instr.symbol))
        .then(_symbols => {
            console.log(`${_symbols.length} symbols not recently adjusted`);
            return _symbols
        })
        .then(_symbols => corporateActionsService.getSymbolsWithLargeGaps(_symbols))
        .then(_quotes => {
            return _quotes.map(q => q.symbol);
        })
        .then(_symbols => {
            console.log(`${_symbols.length} symbols with large caps`);
            return _symbols;
        })
        .then(_symbols => {
            if(corporateActionsFromDB) {
                console.log('Using corporate actions from DB');
                return _symbols;
            } else {
                // Fetch from API
                console.log('Fetching corporate actions from API.');
                return corporateActionsRepository.getFromAPIAndSaveToDB(_symbols)
                    .catch(e => console.error(e.name, e.message.slice(0, 20)))
                    .then(() => _symbols);
            }
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
    instrumentRepository: new InstrumentRepository(mongoFactory),
    corporateActionsRepository: corporateActionsRepository,
    quoteRepository: new QuoteRepository(mongoFactory),
});

const flag = process.argv[2];
const param = process.argv[3];
const corporateActionsFromDB = process.argv.indexOf('--fromDB') > -1;
const skipLastAdjustmentCheck = process.argv.indexOf('--skipLastAdjustmentCheck') > -1;

if(!param || param.length === 0) {
    printHelpAndExit();
}

switch(flag) {
    case '--reset':
        resetQuotes(param.split(','));
        break;
    case '--indices':
        const indices = param.split(',');
        Promise.all(indices.map(_index => instrumentRepository.getIndexComponents(_index)))
            .then(_res => [].concat(..._res))
            .then(_res => [...new Set(_res)])
            .then(_components => _components.map(_component => _component.symbol))
            .then(_symbols => adjustForSplits(_symbols, corporateActionsFromDB, skipLastAdjustmentCheck))
            .catch(e => console.error(e.message, e.stack))
            .finally(shutdown);
        break;

    case '--symbols':
        const symbols = param.split(',');
        adjustForSplits(symbols, corporateActionsFromDB, skipLastAdjustmentCheck)
        break;

    default:
        printHelpAndExit();
}
