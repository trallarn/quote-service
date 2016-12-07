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
        var fromMillis = from.getTime();
        var toMillis = to.getTime();

        return this.quoteRepository.getAsync(symbol, from, to)
            .then(function(quotes) {
                return _.filter(quotes, function(quote) { 
                    var time = quote.date.getTime();
                    return time >= fromMillis && time <= toMillis;
                });
            })
            .then(function(quotes) {
                return Series.getExtremas(_.pluck(quotes, 'close'), epsilon);
            });
    }

};

module.exports = SeriesAnalysis;
