var test = require('tape');
var Series = require('../../src/math/Series.js');

test('getExtremas', function(t) {
    
    //var values = { 0: 10, 1: 20, 2: 30, 3: 15, 4: 25, 5: 5, 6: 50 };
    var values = [ 10, 20, 30, 15, 25, 5, 50 ];

    var extremas = Series.getExtremas(values, 5);

    t.plan(2);

    var expected = {
        min: [15, 5],
        max: [30, 25]
    };

    t.deepEqual(extremas.min, expected.min, 'min ok');
    t.deepEqual(extremas.max, expected.max, 'min ok');

});

