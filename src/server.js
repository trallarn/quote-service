var express = require('express');
var assert = require('assert');
var cors = require('cors');
var bodyParser = require('body-parser');

var QuoteLoader = require('./QuoteLoader.js');
var quoteFetcher = require('./QuoteFetcher.js')();
var mongoFactory = require('./MongoFactory.js')();
var instrumentRepository = require('./InstrumentRepository.js')(mongoFactory);
var nasdaqQuoteFetcher = require('./NasdaqQuoteFetcher.js')({
    instrumentRepository: instrumentRepository
});
var quoteRepository = require('./QuoteRepository.js')(mongoFactory);
var changeRepository = require('./ChangeRepository.js')(quoteRepository, instrumentRepository);
var instrumentRepository = require('./InstrumentRepository.js')(mongoFactory);
var favoritesRepository = require('./FavoritesRepository.js')(mongoFactory);
var quoteSerializer = require('./QuoteSerializer.js');

var quoteLoader = new QuoteLoader({
    quoteRepository: quoteRepository,
    quoteFetcher: quoteFetcher,
    nasdaqQuoteFetcher: nasdaqQuoteFetcher
});

mongoFactory.connect();

assert(quoteRepository, 'quote repo must exist');

var app = express();
app.options('*', cors());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/favorites', cors(), function (req, res) {
    favoritesRepository.saveGroup(req.body)
        .then(function(result) {
            console.dir(result);

            res.status(201).json(result);
        })
        .catch(function(e){
            console.error('save favorites failed ' + e);
            res.sendStatus(500)
        });
});

/**
 * Fetches all instruments.
 */
app.get('/instruments', function (req, res) {
    instrumentRepository.getInstruments(function(instruments){
        res.jsonp(instruments);
    });
});

/**
 * Fetches all indices.
 */
app.get('/indices', function (req, res) {
    instrumentRepository.getIndices(function(indices){
        res.jsonp(indices);
    });
});

app.get('/indexComponents/:index', function (req, res) {
    instrumentRepository.getIndexComponents(req.params.index, function(components){
        res.jsonp(components);
    });
});

app.get('/instruments/change/', function (req, res) {
    console.log('got request params: ' + JSON.stringify(req.params) + ' query: ' + JSON.stringify(req.query));

    if(!req.query.from) {
        console.warn('Missing from query');
        res.jsonp({
            err: 'Must supply from query'
        });

        return;
    }

    var index = req.query.index;
    var from = new Date(req.query.from);
    var to = req.query.to ? new Date(req.query.to) : new Date();

    changeRepository.getInstrumentsWithChange(index, from, to, function(instruments){
        res.jsonp(instruments);
    });
});

/**
 * Fetches daily quotes. 
 * @query params: 
 *  refreshData - fetches and saves quotes from source
 * @return empty if quotes are missing
 */
app.get('/daily/:symbol', function (req, res) {
    var symbol = req.params.symbol;
    var from = new Date(req.query.from || new Date(1900,1,1));
    var to = new Date(req.query.to || new Date());
    var chartType = req.query.chartType || 'ohlc';
    var refreshData = req.query.refreshData;

    console.log('got request params: ' + JSON.stringify(req.params) + ' query: ' + JSON.stringify(req.query));

    var getQuotesAndWrite = quoteRepository.getAsync.bind(quoteRepository, symbol, from, to, function(quotes){
        res.jsonp(quoteSerializer.mongoToHighstock(symbol, quotes, chartType));
    });

    if(refreshData) {
        console.log('refreshing data');
        quoteLoader.fetchDaily([symbol], new Date(1900,1,1), new Date(), getQuotesAndWrite);
    } else {
        getQuotesAndWrite();
    }

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
