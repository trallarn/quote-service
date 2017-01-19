var rp = require('request-promise');
var moment = require('moment');

/*
 * Needs oauth-to work with finance-tables... Not fixed
 *
 */
function YQL() {
    if(!(this instanceof YQL)) {
        return new YQL();
    }
}

YQL.prototype = {

    urlBase: 'https://query.yahooapis.com/v1/public/yql?q={query}&format=json',

    getQuotes: function(symbols) {
        if(typeof symbols === 'string') {
            symbols = [symbols];
        }

        var symbolsString = symbols.join(',');
        var baseQuery = 'select * from pm.finance where symbol in("{symbols}")';
        var query = baseQuery.replace('{symbols}', symbolsString);
        var url = this.urlBase.replace('{query}', query);

        var options = {
            uri: url,
            json: true
        };

        rp(options)
            .then(function(data) {
                if(!Array.isArray(data.query.result.quote)) {
                    // To array
                    data.query.result.quote = [data.query.result.quote];
                }

                var quotes = symbols.map(function(symbol) {
                    var quote = data.query.result.quote.find(function(el) {
                        return el.symbol === symbol;
                    });

                    if(!quote) {
                        return undefined;
                    }

                    return {
                        close: quote.realtime_price,
                        date: moment.utc(quote.realtime_ts).valueOf()
                    };
                });

                return quotes.filter(function(quote) {
                    return quote;
                });
            });
    }
};

module.exports = YQL;
