var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var assert = require('assert');

module.exports = NasdaqQuoteFetcher;

function NasdaqQuoteFetcher(options) {
    if(!(this instanceof NasdaqQuoteFetcher)) {
        return new NasdaqQuoteFetcher(options);
    }

    assert(options.instrumentRepository);

    this.instrumentRepository = options.instrumentRepository;
};

NasdaqQuoteFetcher.prototype = {
    getUrl: function(url, params, callback) {

        request.post(url, params, function(err, response, body) {
            if(err) {
                throw err;
            }

            callback(body);
        }.bind(this));
    },

    fetchTodaysQuotesForIndex: function(isin, callback) {
        var baseUrl = 'http://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx';

        var postParams = fs.readFileSync('src/data/nasdaq-index-post-params.xml', { 
            encoding: 'utf8' 
        });

        postParams = postParams
            .replace(/\n/g, '')
            .replace('{isin}', isin);

        var params = { 
            form: {
                xmlquery: postParams
            }
        };

        var url = baseUrl;

        this.getUrl(url, params, function(body) {
            var quotes = this.parseQuotes(body);

            // Add date
            var midnight = new Date();
            midnight.setHours(0,0,0,0);

            _.each(quotes, function(quote) {
                quote.date = midnight;
            });

            // Add symbol
            var names = _.pluck(quotes, 'name');

            this.instrumentRepository.getInstrumentsByNames(names, function(instruments) {
                _.each(quotes, function(quote) {
                    var instrument = _.find(instruments, function(instrument) {
                        return instrument.name === quote.name;
                    });

                    if(instrument) {
                        quote.symbol = instrument.symbol;
                    }
                });

                // Only use quotes with symbol
                quotes = _.filter(quotes, function(quote) { return quote.symbol; });

                callback(quotes);
            });
        }.bind(this));

    },

    parseQuotes: function(body) {
        var $ = cheerio.load(body);
        var rows = $('#sharesInIndexTable tr').has('td');
        //console.log(body);

        var quotes = [];
        rows.each(function(i, row) {
            var $row = $(row);
            var name = $row.find('td a').first().text();

            var rowEls = $row.children();
            var close = Number(rowEls.first().next().next().text());
            var vol = Number(rowEls.first().next().next().next().next().next().next().next()
            .text()
            .replace(/,/g, ''));

            console.log('name ' + name + ' vol ' + vol);

            if(name) {
                quotes.push({
                    name: name,
                    close: close,
                    open: close,
                    high: close,
                    low: close,
                    volume: vol
                });
            }
        });

        return quotes;
    }
};
