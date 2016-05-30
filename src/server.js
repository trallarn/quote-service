var express = require('express');
var assert = require('assert');

var QuoteLoader = require('./QuoteLoader.js');
var quoteFetcher = require('./QuoteFetcher.js')();
var mongoFactory = require('./MongoFactory.js')();
var quoteRepository = require('./QuoteRepository.js')(mongoFactory);
var quoteSerializer = require('./QuoteSerializer.js');

mongoFactory.connect();

assert(quoteRepository, 'quote repo must exist');


var app = express();

/**
 * Fetches daily quotes. 
 * @return empty if quotes are missing
 */
app.get('/daily/:symbol', function (req, res) {
    var symbol = req.params.symbol;
    var from = req.query.from || new Date(1900,1,1);
    var to = req.query.to || new Date();
    var chartType = req.params.chartType || 'ohlc';
    console.log('got request params: ' + JSON.stringify(req.params) + ' query: ' + JSON.stringify(req.query));

    quoteRepository.getAsync(symbol, from, to, function(quotes){
        res.jsonp(quoteSerializer.mongoToHighstock(symbol, quotes, chartType));
    });
});

/**
 * Tries to fetch new quotes upstream if missing in db.
 * @return quotes
 */
app.get('/quotes/:symbol', function(req, res) {
    // TODO: CONTINUE: read from to from params
    var symbol = req.params.symbol;
    var from = req.query.from || new Date(1900,1,1);
    var to = req.query.to || new Date();

    var quotes = quoteRepository.getAsync(symbol, from, to, function(quotes){
        if(quotes.length === 0) {

            quoteLoader.fetchDaily(symbol, from, to, function() {
                quotes = quoteRepository.getAsync(symbol, from, to, function(quotes){
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
