var test = require('tape');
var Series = require('../../../src/math/Series.js');
var _ = require('underscore');


var testGetExtremasTTL = function(t, params) {
    t.plan(4);

    // Run tests from params
    var ys = params.ys;
    var xs = _.range(ys.length);

    var ttls = [params.expected.ttl];
    var extremas = Series.getExtremasTTL(ys, xs, ttls);
    var expected = params.expected;
    //console.dir(extremas);

    t.deepEqual(extremas[0].maxY, expected.maxY, 'max ys');
    t.deepEqual(extremas[0].maxX, expected.maxX, 'max xs');
    t.deepEqual(extremas[0].minY, expected.minY, 'min ys');
    t.deepEqual(extremas[0].minX, expected.minX, 'min xs');
};

test('getExtremasTTL ttl 1', function(t) {
    testGetExtremasTTL(t, {
        ys: [ 10, 20, 12, 30, 15, 25, 5, 40, 35, 50 ],
        expected: {
            ttl: 1,
            maxY: [20,30,25,40],
            maxX: [1,3,5,7],
            minY: [12,15,5,35],
            minX: [2,4,6,8]
        }
    });
});

test('getExtremasTTL ttl 3', function(t) {
    testGetExtremasTTL(t, {
            ys: [ 10, 20, 12, 30, 15, 25, 5, 40, 35, 50 ],
            expected: {
                ttl: 3,
                maxY: [30],
                maxX: [3],
                minY: [5],
                minX: [6]
            }
        });
});

test('getExtremasTTL ttl 100', function(t) {
    testGetExtremasTTL(t, {
        ys: [ 10, 20, 12, 30, 15, 25, 5, 40, 35, 50 ],
        expected: {
            ttl: 100,
            maxY: [],
            maxX: [],
            minY: [5],
            minX: [6]
        }
    });
});

test('getExtremasOfDegree', function(t) {
    var params = [
        {
            ys: [ 10, 20, 12, 30, 15, 25, 5, 40, 35, 50 ],
            degree: 0,
            expected: {
                maxY: [20,30,25,40,50],
                maxX: [1,3,5,7,9],
                minY: [10,12,15,5,35],
                minX: [0,2,4,6,8]
            }
        }
        , {
            ys: [ 10, 20, 12, 30, 15, 25, 5, 40, 35, 50 ],
            degree: 1,
            expected: {
                maxY: [30,50],
                maxX: [3,9],
                minY: [10,5],
                minX: [0,6]
            }
        }
    ];

    t.plan(4 * params.length);

    // Run tests from params
    for(var i = 0; i < params.length; i++) {
        var ys = params[i].ys;
        var xs = _.range(ys.length);

        var extremas = Series.getExtremasOfDegree(ys, xs, params[i].degree);

        var expected = params[i].expected;

        t.deepEqual(extremas.maxY, expected.maxY, 'max ys');
        t.deepEqual(extremas.maxX, expected.maxX, 'max xs');
        t.deepEqual(extremas.minY, expected.minY, 'min ys');
        t.deepEqual(extremas.minX, expected.minX, 'min xs');
    }

});

test('getExtremas', { skip: true }, function(t) {
    
    var ys = [ 10, 20, 30, 15, 25, 5, 50 ];
    var xs = _.range(ys.length);

    var extremas = Series.getExtremas(ys, xs, 0);

    t.plan(4);

    var expected = {
        minY: [15, 5],
        maxY: [30, 25],
        minX: [3, 5],
        maxX: [2,4]
    };

    t.deepEqual(extremas.minY, expected.minY, 'min ys ok');
    t.deepEqual(extremas.maxY, expected.maxY, 'max ys ok');
    t.deepEqual(extremas.minX, expected.minX, 'min xs ok');
    t.deepEqual(extremas.maxX, expected.maxX, 'max xs ok');

});

