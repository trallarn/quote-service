var test = require('tape');

var moment = require('moment');
var mongoFactory = require('../../../src/MongoFactory.js')();
var quoteRepository = require('../../../src/QuoteRepository.js')(mongoFactory);
var instrumentRepository = require('../../../src/InstrumentRepository.js')(mongoFactory);
var SeriesAnalysis = require('../../../src/service/SeriesAnalysis.js');

test.onFinish(function() {
    mongoFactory.closeEquityDb();
});

var seriesAnalysis = new SeriesAnalysis(quoteRepository, instrumentRepository);

test('getExtremasTTL SWMA', {skip:false},function(t) {


    var from = moment.utc('2015-01-17');
    var to = moment.utc('2016-01-17');

    t.plan(1);

    seriesAnalysis.getExtremasTTL('SWMA.ST', from, to, [50])
        .then(function(extremas) {
            console.dir(extremas);
            t.deepEqual(extremas[0], { ttl: 50,
                maxY: [ 271.3, 269 ],
                minY: [ 235.8 ],
                maxX: [ 1429747200000, 1438732800000 ],
                minX: [ 1435622400000 ] 
            }, 'wrong extremas');
        })
        .catch(function(e) {
            console.error(e);
            console.error(e.stack);
        });

});

test('getCloseToExtremas verify 2 instruments', {skip:false}, function(t) {

    var from = moment.utc('2017-01-17').subtract(1, 'year');
    var at = moment.utc('2017-01-17');

    t.plan(1);

    instrumentRepository.getInstrumentsBySymbols(['ABB.ST','ASSA-B.ST','ERIC-B.ST'])
        .then(components => seriesAnalysis.getCloseToExtremas(components, from, 50, 2, at))
        .then(extremas => {
            //console.dir(extremas);
            t.equal(extremas.length, 2, 'wrong count');
        })
        .catch(e => {
            console.error(e);
            console.error(e.stack);
            t.fail(e.message);
        });

});

