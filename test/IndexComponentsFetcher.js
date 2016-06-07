var test = require('tape');
var fs = require('fs');
var IndexComponentsFetcher = require('../src/index/IndexComponentsFetcher.js');

test('parse components', function(t) {
    var fetcher = new IndexComponentsFetcher();

    var testTable = fs.readFileSync('testdata/nasdaqomxtable.html');
    var components = fetcher.parseNasdaqOmx(testTable);

    var expectedComponents = [ 
        { name: 'AAK', symbol: 'AAK' },
        { name: 'ABB Ltd', symbol: 'ABB' },
        { name: 'Alfa Laval', symbol: 'ALFA' },
        { name: 'Autoliv SDB', symbol: 'ALIV SDB' } 
    ];

    t.plan(1);

    t.deepEqual(components, expectedComponents , 'components ok');

    //console.log(components);

});

