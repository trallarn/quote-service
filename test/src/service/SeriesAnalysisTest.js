var test = require('tape');

var moment = require('moment');
var mongoFactory = require('../../../src/MongoFactory.js')();
var quoteRepository = require('../../../src/QuoteRepository.js')(mongoFactory);
var instrumentRepository = require('../../../src/InstrumentRepository.js')(mongoFactory);
var SeriesAnalysis = require('../../../src/service/SeriesAnalysis.js');

function tearDown() {
    mongoFactory.closeEquityDb();
}

test('getCloseToExtremas verify 2 instruments', function(t) {

    var seriesAnalysis = new SeriesAnalysis(quoteRepository, instrumentRepository);

    var from = moment.utc('2017-01-17').subtract(1, 'year');
    var at = moment.utc('2017-01-16');

    t.plan(1);

    seriesAnalysis.getCloseToExtremas('OMXS30', from, 50, 2, at)
        .then(function(extremas) {
            console.dir(extremas);
            t.equal(extremas.length, 2, 'wrong count');
            tearDown();
        })
        .catch(function(e) {
            console.error(e);
            console.error(e.stack);
        });

});

