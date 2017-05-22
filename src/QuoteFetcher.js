var _ = require('underscore');
var yahooFinance = require('yahoo-finance');
var request = require("request");
var csv = require('csv');
var zeroFill = require('zero-fill');
var quoteRepository = require('./QuoteRepository.js')(false);

module.exports = QuoteFetcher;

function QuoteFetcher () {

    var url = 'http://real-chart.finance.yahoo.com/table.csv?s={symbol}&a={fm}&b={fd}&c={fy}&d={tm}&e={td}&f={ty}';

    var parseData = function(symbols, data, callback) {
        var options = {
            comment: '#',
            auto_parse: true,
            auto_parse_date: true,
            columns: ['date','open','high','low','close','volume','adj close']
        };

        console.dir(data);
        throw 'TODO';

        csv.parse(data, options, function(err, data) {
            if(err) {
                throw 'Error: ' + err;
            }

            _.each(data, function(el) {
                el.symbol = symbol;
            });

            callback(data);
        });
    };

    return {

        fetchDataFromLocalFile: function(symbols, from, to, callback) {
            var dataForSymbols = {};
            var count = 0;

            _.each(symbols, function(symbol) {
                quoteRepository.readLocalFile(symbol, function(data) {
                    count++;
                    dataForSymbols[symbol] = data;

                    if(count === symbols.length) {
                        callback(dataForSymbols);
                    }

                });
            }, this);
        },

        /**
         * Fetches historical data from yahoo using module.
         * @param period d - daily, w - weekly, m - monthly
         */
        fetchData: function(symbols, from, to, period) {
            var fromYear = from.getFullYear(), 
                fromMonth = from.getMonth() + 1, 
                fromDay = from.getDate(), 
                toYear = to.getFullYear(), 
                toMonth = to.getMonth() + 1, 
                toDay = to.getDate();

            period = period || 'd';
            symbols = _.isArray(symbols) ? symbols : [symbols];
            var from = fromYear+'-'+ zeroFill(2, fromMonth) +'-'+ zeroFill(2, fromDay);
            var to = toYear+'-'+ zeroFill(2, toMonth) +'-'+ zeroFill(2, toDay);

            console.log('Fetching historical for ' + symbols + ' from ' + from + ' to ' + to);

debugger;
            return yahooFinance.historical({
                symbols: symbols,
                from: from,
                to: to,
                period: period,
                error: true
                }
            );
        },

        snapshot: function(symbols) {
            symbols = typeof symbols === 'string' ? [symbols] : symbols;

            return yahooFinance.snapshot({
                symbols: symbols
            })
            .then(function(snapshot) {
                return snapshot;
            });
        },

        fetchDataOwnImplementation: function(symbols, fromYear, fromMonth, fromDay, toYear, toMonth, toDay, callback) {

            symbols = _.isArray(symbols) ? symbols : [symbols];

            var lUrl = url.replace('{symbol}', symbols.join(','))
                .replace('{fy}', fromYear)
                .replace('{fm}', fromMonth)
                .replace('{fd}', fromDay)
                .replace('{ty}', toYear)
                .replace('{tm}', toMonth)
                .replace('{td}', toDay);

            console.log('querying url: "' + lUrl);

            request(lUrl, function(error, response, body) {

                if(error) {
                    console.log(error);
                    throw 'Error: ' + error;
                }

                body = '#' + body;
                parseData(symbols, body, callback);
            });
        }

    };
};
