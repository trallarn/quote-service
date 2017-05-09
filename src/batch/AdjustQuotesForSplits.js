/**
 * Script that adjust quotes for splits.
 * Run without args for flags.
 */

const _ = require('underscore');
const ArgumentParser = require('argparse').ArgumentParser;
const Promise = require('bluebird');

const DI = require('../DI')({ env: 'dev' });

function shutdown() {
    DI.mongoFactory.closeEquityDb();
}

/**
 * Filters instruments with adjustment date older than a certain time.
 */
function filterInstrumentsNotRecentlyAdjusted(skipLastAdjustmentCheck, instruments) { 
    if(skipLastAdjustmentCheck === true) {
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
            if(_symbols.length > 0) {
                console.log(`${_symbols.length} symbols not recently adjusted`);
            }
            return _symbols
        })
        .then(_symbols => corporateActionsService.getSymbolsWithLargeGaps(_symbols))
        .then(_quotes => {
            return _quotes.map(q => q.symbol);
        })
        .then(_symbols => {
            if(_symbols.length > 0) {
                console.log(`${_symbols.length} symbols with large gaps`);
            }
            return _symbols;
        })
        .then(_symbols => {
            if(corporateActionsFromDB) {
                //console.log('Using corporate actions from DB');
                return _symbols;
            } else {
                // Fetch from API
                //console.log('Fetching corporate actions from API.');
                return corporateActionsRepository.getFromAPIAndSaveToDB(_symbols)
                    .catch(e => console.error(e.name, e.message.slice(0, 20)))
                    .then(() => _symbols);
            }
        })
        .then(_symbols => {
            return _symbols.map(symbol => {
                return corporateActionsService.adjustDailyForSplits(symbol)
                    .then((ret) => {
                        console.log('Adjusted ' + symbol + ' for splits');
                    })
                    .catch(function(err) {
                        console.log('', err, err.stack);
                    });
            });
        })
        .then(Promise.all);
}

/**
 * Adjust splits in batches for smaller memory footprint.
 */
function adjustForSplitsInBatches(symbols, corporateActionsFromDB, skipLastAdjustmentCheck, batchSize) {

    if(skipLastAdjustmentCheck === true) {
        console.log('Skipping last adjustment check');
    }

    let promise = Promise.resolve();

    for(let i = 0; i < symbols.length; i += batchSize) {
        const to = i + batchSize;
        const symbolsBatch = symbols.slice(i, to);

        promise = promise
            .then(() => {
                console.log(`Running batch from ${i} to ${to}`);
                return adjustForSplits(symbolsBatch, corporateActionsFromDB, skipLastAdjustmentCheck)
            });
    }

    return promise;
}

function resetQuotes(symbols) {
    console.log('Resetting quotes for ' + symbols);
    corporateActionsService.resetQuotesToOrigForSymbols(symbols)
        .catch(e => console.error(e.message, e.stack))
        .finally(shutdown);
}

const corporateActionsRepository = DI.corporateActionsRepository;
const instrumentRepository = DI.instrumentRepository;
const corporateActionsService = DI.corporateActionsService;

var parser = new ArgumentParser({
  addHelp: true,
  description: 'This scripts adjusts quotes for splits.'
});

const group = parser.addMutuallyExclusiveGroup({ required: true });
group.addArgument( [ '--reset' ], { 
    help: '<symbol,...,symbol>',
});
group.addArgument( [ '--indices' ], { 
    help: '<index,...,index>',
});
group.addArgument( [ '--symbols' ], { 
    help: '<symbol,...,symbol>',
});

parser.addArgument( [ '--batchSize' ], { 
    help: 'size of batch', 
    type: 'int',
    defaultValue: 100 
});
parser.addArgument( [ '--fromDB' ], { 
    help: 'fetch corporate actions from DB instead of API', 
    action: 'storeTrue', 
    defaultValue: false 
});
parser.addArgument( [ '--skipLastAdjustmentCheck' ], { 
    help: 'adjusts splits even though they were recently adjusted', 
    action: 'storeTrue', 
    defaultValue: false 
});

const args = parser.parseArgs();
//console.log(args);

if(args.reset) {
    resetQuotes(args.reset.split(','));
} else if(args.indices) {
    const indices = args.indices.split(',');
    Promise.all(indices.map(_index => instrumentRepository.getIndexComponents(_index)))
        .then(_res => [].concat(..._res))
        .then(_components => [...new Set(_components.map(_component => _component.symbol))]) // unique symbols
        .then(_symbols => adjustForSplitsInBatches(_symbols, args.fromDB, args.skipLastAdjustmentCheck, args.batchSize))
        .catch(e => console.error(e.message, e.stack))
        .then(shutdown);
} else if(args.symbols) {
    const symbols = args.symbols.split(',');
    adjustForSplitsInBatches(symbols, args.fromDB, args.skipLastAdjustmentCheck, args.batchSize)
        .catch(e => console.error(e.message, e.stack))
        .then(shutdown);
}
