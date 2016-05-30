var _ = require('underscore');

var quoteSerializer = {

    /**
     * Serializes mongo data as high stock data.
     */
    mongoToHighstock: function(symbol, data, chartType) {
        var payload = chartType === 'ohlc' ? this.mongoToHighstockOHLC(symbol, data)
            : chartType === 'line' ? this.mongoToHighstockLine(symbol, data)
                : false;

        if(!payload) {
            throw 'Invalid chartType "' + chartType + '". Must be <ohlc,line>.';
        }

        return payload;
    },

    mongoToHighstockLine: function(symbol, data) {
        var quotes = _.map(data, function(quote) {
            return {
                x: new Date(quote.date).getTime(),
                y: quote.close,
                name: quote.symbol,
                color: '#328822'
            };

        });

        return this.withMeta(symbol, quotes);
    },

    mongoToHighstockOHLC: function(symbol, data) {
        var quotes = _.map(data, function(quote) {
            return {
                x: new Date(quote.date).getTime(),
                open: quote.open,
                high: quote.high,
                low: quote.low,
                close: quote.close,
                name: quote.symbol,
                color: '#328822'
            };

        });

        return this.withMeta(symbol, quotes);
    },

    withMeta: function(symbol, quotes) {
        return {
            symbol: symbol,
            quotes: quotes
        };
    }

};

module.exports = quoteSerializer;
