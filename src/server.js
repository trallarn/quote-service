var express = require('express');
var assert = require('assert');

var QuoteLoader = require('./QuoteLoader.js');
var quoteFetcher = require('./QuoteFetcher.js')();
var mongoFactory = require('./MongoFactory.js')();
var quoteRepository = require('./QuoteRepository.js')(mongoFactory);

mongoFactory.connect();

assert(quoteRepository, 'quote repo must exist');


var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/quotes/', function(req, res) {
    // TODO: CONTINUE: read from to from params
    var from = new Date(2015,0,1);
    var to = new Date(2016,5,1);

    var quotes = quoteRepository.getAsync('eric', from, to, function(quotes){
        if(quotes.length === 0) {

            quoteLoader.fetchDaily('eric', from, to, function() {
                quotes = quoteRepository.getAsync('eric', from, to, function(quotes){
                    res.send(quotes);
                });
            });
        } else {
            //console.log('quotes::::: '  + JSON.stringify(quotes));
            res.send(quotes);
        }
    });

});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
