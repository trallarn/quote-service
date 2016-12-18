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

    extremesTTLToLines: function(extremes) {
        return _.map(extremes, function(extreme) {
            var line = this.extremesToLine(extreme);
            line.ttl = extreme.ttl;
            return line;
        }, this);
    },

    extremesToLine: function(extremes) {
        var maxs = [];
        var mins = [];

        for(var i = 0; i < extremes.maxX.length; i++) {
            maxs.push([
                extremes.maxX[i],
                extremes.maxY[i]
            ]);
        }

        for(var i = 0; i < extremes.minX.length; i++) {
            mins.push([
                extremes.minX[i],
                extremes.minY[i]
            ]);
        }

        return {
            maxs: maxs,
            mins: mins
        };
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
            //return {
            //    x: new Date(quote.date).getTime(),
            //    open: quote.open,
            //    high: quote.high,
            //    low: quote.low,
            //    close: quote.close,
            //    name: quote.symbol,
            //    color: '#328822'
            //};
            return [
                new Date(quote.date).getTime(),
                quote.open,
                quote.high,
                quote.low,
                quote.close
            ];

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
