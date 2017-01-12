var test = require('tape');
var fs = require('fs');
var IndexComponentsFetcher = require('../../src/index/IndexComponentsFetcher.js');

test('parse components', function(t) {
    var fetcher = new IndexComponentsFetcher();

    var testTable = fs.readFileSync('testdata/nasdaqomxtable.html');
    var components = fetcher.parseNasdaqOmxListedCompanies(testTable);

    var expectedComponents = [ 
        { name: 'AAK', symbol: 'AAK', currency:"SEK" },
        { name: 'ABB Ltd', symbol: 'ABB', currency:"SEK" },
        { name: 'Alfa Laval', symbol: 'ALFA', currency:"SEK" },
        { name: 'Autoliv SDB', symbol: 'ALIV SDB', currency:"SEK" } 
    ];

    t.plan(4 * 3);

    for(var i = 0; i < components.length; i++) {
        var actual = components[i];
        var exp = expectedComponents[i];
        t.equal(actual.name, exp.name, 'name mismatch');
        t.equal(actual.symbol, exp.symbol, 'symbol mismatch');
        t.equal(actual.currency, exp.currency, 'currency mismatch');
    }
    //t.deepEqual(components, expectedComponents , 'components ok');

    //console.log(components);

});

