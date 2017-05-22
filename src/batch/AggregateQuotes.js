const ArgumentParser = require('argparse').ArgumentParser;

const DI = require('../DI')({ env: 'dev' });
const MongoPrinter = require('../mongo/MongoPrinter');

function shutdown() {
debugger;
    DI.mongoFactory.closeEquityDb();
}

function onError(e) {
    console.error(e.message, e.stack);
}

/**
 * Aggregates from daily -> weekly -> monthly.
 */
function aggregate(db) {
    const group = { 
        symbol: {$first: "$symbol"},
        date: {$first: "$date" },
        close : {$last: "$close"}, 
        open: {$first: "$close"}, 
        high: {$max: "$close"}, 
        low: {$min: "$close"} 
    };

    const weekGroup = Object.assign({}, group, {
        _id: { symbol: "$symbol", year: { $year: "$date" }, week: { $week: "$date" } }
    });

    const monthGroup = Object.assign({}, group, {
        _id: { symbol: "$symbol", year: { $year: "$date" }, month: { $month: "$date" } }
    });

    return db.collection('quotesDaily').aggregate([ 
        //{ $match: { symbol: "ATCO-B.ST" } },  // For test
        //{ $match: { symbol: { $type: 2 } } }, // Checks for string
        { $group: weekGroup },
        { $out: "quotesWeekly" }
    ])
    .toArray()
    .then(() => 
        db.collection('quotesWeekly').aggregate([ 
            { $group: monthGroup },
            { $out: "quotesMonthly" }
        ]) 
        .toArray()
    );
}


var parser = new ArgumentParser({
  addHelp: true,
  description: 'Aggregates quotes weekly or monthly'
});

const group = parser.addMutuallyExclusiveGroup({ required: true });
group.addArgument( [ '--weekly' ], { 
    help: 'aggregate weekly',
    action: 'storeTrue', 
});
group.addArgument( [ '--monthly' ], { 
    help: 'aggregate monthly',
    action: 'storeTrue', 
});

parser.addArgument( [ '--symbols' ], { 
    help: '<symbol,...,symbol>'
});

const args = parser.parseArgs();

//const symbols = args.symbols.split(',');

if(args.weekly) {
    DI.mongoFactory.getEquityDb()
        .then(aggregate)
        .then(shutdown)
        .catch(onError);
} else if(args.monthly) {

}
