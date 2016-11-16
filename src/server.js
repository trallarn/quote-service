var express = require('express');
var assert = require('assert');

// Express middleware
var cors = require('cors');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')

var UserService = require('./service/UserService.js');
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

var userService = new UserService();

mongoFactory.connect();

assert(quoteRepository, 'quote repo must exist');

var corsOptions = {
    origin: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true
};

var app = express();
app.options('*', cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser())

app.post('/user/login', cors(corsOptions), function (req, res) {
    if(!userService.login(res, req.body.username)) {
        res.status(400).send('Username must not be empty');
    } else {
        res.end();
    }
});

app.post('/favorites', cors(corsOptions), function (req, res) {
    if(!userService.isLoggedIn(req)) {
        res.sendStatus(401);
        return;
    }

    favoritesRepository.insertGroup(req.body, userService.getUsername(req))
        .then(function(result) {
            console.dir(result);

            res.status(201).json(result);
        })
        .catch(function(e){
            console.error('save favorites failed ' + e);
            res.sendStatus(500)
        });
});

app.put('/favorites', cors(corsOptions), function (req, res) {
    if(!userService.isLoggedIn(req)) {
        res.sendStatus(401);
        return;
    }

    favoritesRepository.updateGroup(req.body, userService.getUsername(req))
        .then(function(result) {
            console.error('updated favorites ok ');
            //console.log(result);
            res.status(201).json(result);
        })
        .catch(function(e){
            console.error('update favorites failed ' + e);
            res.sendStatus(500)
        });
});

app.get('/favorites', cors(corsOptions), function (req, res) {
    if(!userService.isLoggedIn(req)) {
        res.sendStatus(401);
        return;
    }

    favoritesRepository.getFavorites(userService.getUsername(req))
        .then(function(result) {
            console.dir(result);
            res.json(result);
        })
        .catch(function(e){
            console.error('get favorites failed ' + e);
            res.sendStatus(500);
        });
});

app.delete('/favorites/:id', cors(corsOptions), function (req, res) {
    if(!userService.isLoggedIn(req)) {
        res.sendStatus(401);
        return;
    }

    var id = req.params.id;

    if(!id) {
        res.status(400).send('Bad id');
        return;
    }

    favoritesRepository.deleteGroup(userService.getUsername(req), id)
        .then(function(result) {
            res.end();
        })
        .catch(function(e){
            console.error('delete favorites failed ' + e);
            res.sendStatus(500);
        });
});

/**
 * Fetches all instruments.
 */
app.get('/instruments', cors(corsOptions), function (req, res) {
    var symbols = req.query.symbols;

    if(symbols) {
        instrumentRepository.getInstrumentsBySymbols(symbols, function(instruments){
            res.jsonp(instruments);
        });
    } else {
        instrumentRepository.getInstruments(function(instruments){
            res.jsonp(instruments);
        });
    }
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
