var Promise = require('promise');
var _ = require('underscore');
var quoteSerializer = require('../QuoteSerializer.js');

var Series = require('../math/Series.js');

var SeriesAnalysis = function(quoteRepository) {
    this.quoteRepository = quoteRepository;
};

SeriesAnalysis.prototype = {

    _getClosings: function(quotes) {
        return _.pluck(quotes, 'close');
    },

    _getDates: function(quotes) {
        return _.map(quotes, function(val) { 
            return val.date.getTime(); 
        });
    },

    getExtremasTTL: function(symbol, from, to, ttls) {
        return this.quoteRepository.getAsync(symbol, from, to)
            .then(function(quotes) {
                try {
                    var extremes = Series.getExtremasTTL(this._getClosings(quotes), this._getDates(quotes), ttls);

                    return quoteSerializer.extremesTTLToLines(extremes);
                } catch (e) {
                    return Promise.reject(e);
                }
            }.bind(this));
    },

    /**
     * Gets min max extremas.
     * @return Promise
     */
    getExtremasOfDegree: function(symbol, from, to, epsilon) {
        return this.quoteRepository.getAsync(symbol, from, to)
            .then(function(quotes) {
                try {
                    var extremes = Series.getExtremasOfDegree(this._getClosings(quotes), this._getDates(quotes), epsilon);
                    return quoteSerializer.extremesToLine(extremes);
                } catch (e) {
                    return Promise.reject(e);
                }
            });
    }

};

module.exports = SeriesAnalysis;
