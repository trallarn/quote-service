/**
 * Usage: node <filename> <index name> <comma sep. index symbols> <html for nasdaq omx index table>
 * Saves the parsed index in db.
 */
var _ = require('underscore');

var InstrumentRepository = require('../InstrumentRepository.js');
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});
var IndexComponentsFetcher = require('../index/IndexComponentsFetcher.js');

var instrumentRepository = new InstrumentRepository(mongoFactory);
var fetcher = new IndexComponentsFetcher();

var name = process.argv[2];
var indexSymbols = process.argv[3];
var body = process.argv[4];

if(!name) {
    throw 'Missing name cmd line arg';
}
if(!body) {
    throw 'Missing body cmd line arg';
}

if(indexSymbols) {
    indexSymbols = indexSymbols.split(',');
}

var indexSpec = {
    name: name,
    indexSymbols: indexSymbols
};

var components = fetcher.parseNasdaqOmxIndexComponents(body);

//console.log('got components: ' + JSON.stringify(components));

var names = _.map(components, function(c) { return c.name; } );

function createIndex(components, index) {
    return {
        symbols: _.map(components, function(c) { return c.symbol;}),
        name: index.name,
        indexSymbols: index.indexSymbols
    };
}

instrumentRepository.getInstrumentsByNames(names, function(instruments) {

    var index = createIndex(instruments, indexSpec);
    //console.log('got index: ' + JSON.stringify(index));

    // Continue to save index in db
    instrumentRepository.saveIndex(index)
        .then(function() {
            mongoFactory.closeEquityDb();
        })
        .catch(function(err) { 
            console.log(err);
            mongoFactory.closeEquityDb();
        });

});

