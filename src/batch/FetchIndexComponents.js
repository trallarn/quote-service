/**
 * This script fetches index components and stores them in db.
 */

var _ = require('underscore');

var IndexComponentsFetcher = require('../index/IndexComponentsFetcher.js');
var InstrumentRepository = require('../InstrumentRepository.js');
var mongoFactory = require('../MongoFactory.js')({env: 'dev'});

var fetcher = new IndexComponentsFetcher();
var instrumentRepository = new InstrumentRepository(mongoFactory);

function convertToYahooSymbols(components) {
    return _.map(components, function(component) {
        var o = _.clone(component);
        o.nasdaqSymbol = component.symbol;
        o.symbol = (component.symbol.replace(' ', '-') + '.st').toUpperCase();
        return o;
    });
}

function createIndex(components, name) {
    return {
        symbols: _.map(components, function(c) { return c.symbol;}),
        name: name
    };
}


var indexName = 'stockholm';

fetcher.fetchComponentsFromNasdaqOmx(indexName, function(components) {
    console.log('got components: ' + JSON.stringify(components));

    components = convertToYahooSymbols(components);
    var index = createIndex(components, indexName);

    // Continue to save in db
    instrumentRepository.saveIndex(index);
    instrumentRepository.saveInstruments(components);

    mongoFactory.closeEquityDb();

});

