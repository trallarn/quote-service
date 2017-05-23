var test = require('tape');

var mongoFactory = require('../../src/MongoFactory.js')();
var quoteRepository = require('../../src/QuoteRepository.js')(mongoFactory);

test.onFinish(function(){
    // Close db
    mongoFactory.closeEquityDb();
});

test('getAsync default daily', function(t) {
    t.plan(1);

    quoteRepository.getAsync('ERIC-B.ST', false, false)
        .then(quotes => {
            t.ok(quotes.length > 0, 'quotes no empty');
        });
});

test('getAsync weekly', function(t) {
    t.plan(3);

    quoteRepository.getAsync('ERIC-B.ST', false, false, { period: 'weekly' })
        .then(quotes => {
            t.ok(quotes.length > 0, 'quotes no empty');
            const first = quotes[0];
            t.ok(first._id.year, 'expected year in _id');
            t.ok(first._id.week, 'expected week in _id');
        });
});
test('getAsync monthly', function(t) {
    t.plan(3);

    quoteRepository.getAsync('ERIC-B.ST', false, false, { period: 'monthly' })
        .then(quotes => {
            t.ok(quotes.length > 0, 'quotes no empty');
            const first = quotes[0];
            t.ok(first._id.year, 'expected year in _id');
            t.ok(first._id.month, 'expected month in _id');
        });
});
