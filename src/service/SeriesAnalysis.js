var Promise = require('promise');
var _ = require('underscore');

var Series = require('../math/Series.js');

var SeriesAnalysis = function(quoteRepository) {
    this.quoteRepository = quoteRepository;
};

SeriesAnalysis.prototype = {

    /**
     * Gets min max extremas.
     * @return Promise
     */
    getExtremas: function(symbol, from, to, epsilon) {
        return this.quoteRepository.getAsync(symbol, from, to)
            .then(function(quotes) {
                try {
                    return Series.getExtremas(_.pluck(quotes, 'close'), _.map(quotes, function(val) { return val.date.getTime(); } ), epsilon);
                } catch (e) {
                    return Promise.reject(e);
                }
            });
    }

};

module.exports = SeriesAnalysis;
