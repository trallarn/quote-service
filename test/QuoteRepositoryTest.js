var test = require('tape');

var mongoFactory = require('../src/MongoFactory.js')();
var quoteRepository = require('../src/QuoteRepository.js')(mongoFactory);

test.onFinish(function(){
    // Close db
    mongoFactory.closeEquityDb();
});

test('getAsync', function(t) {
    t.plan(1);

    quoteRepository.getAsync('ERIC-B.ST', false, false)
        .then(function(quotes) {
            t.ok(quotes.length > 0, 'quotes no empty');
        });
});
