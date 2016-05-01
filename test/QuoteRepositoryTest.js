var test = require('tape');

var mongoFactory = require('../src/MongoFactory.js')();
var quoteRepository = require('../src/QuoteRepository.js')(mongoFactory);

test('getAsync', function(t) {
    t.plan(1);

    //quoteRepository.getAsync('ERIC');
   quoteRepository.getAsync('ERIC', false, false, function(quotes) {
       t.ok(quotes.length > 0, 'quotes no empty');
       t.end();
   });

});

test('get', function(t) {
    t.plan(1);

    //quoteRepository.getAsync('ERIC');
   var quotes = quoteRepository.get('ERIC', false, false);
   t.ok(quotes.length > 0, 'quotes no empty');
   t.end();

});
