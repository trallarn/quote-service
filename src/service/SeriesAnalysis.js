var Promise = require('promise');
var moment = require('moment');
var _ = require('underscore');
var quoteSerializer = require('../QuoteSerializer.js');

var Series = require('../math/Series.js');

var SeriesAnalysis = function(quoteRepository, instrumentRepository) {
    this.quoteRepository = quoteRepository;
    this.instrumentRepository = instrumentRepository;
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

    /**
     * Gets instrument close to an extrema.
     * @param index - index
     * @param ttl - see getExtremasTTL 
     * @param from - see getExtremasTTL 
     * @param withinPercent - defaults 
     * @param at - optional date for comparison, defaults to now
     * @return promise
     */
    getCloseToExtremas: function(index, from, ttl, withinPercent, at) {
        var at = at ? new Date(at) : new Date();
        var to = moment(at).add(ttl, 'days').toDate();
        var ttls = [ttl];

        var self = this;

        // Adds the at-quote.
        var withAtQuote = function(data) {
            return self.quoteRepository.getAt(data.instrument.symbol, at)
                .then(function(quote) {
                    data.quote = quote;
                    return data;
                });
        };

        // Filters instruments close to extreme
        var filter = function(datas) {
            datas = _.filter(datas, function(data) {
                return data.quote;
            });

            return _.filter(datas, function(data) {
                var allExtremas = [].concat(data.extremas.maxY)
                    .concat(data.extremas.minY);

                var within = data.quote.close * withinPercent / 100;

                return _.find(allExtremas, function(extr) {
                    if(Math.abs(data.quote.close - extr) < within) {
                        //console.log('incl %s %s %s ', data.quote.symbol, data.quote.close, extr);
                        return true;
                    }
                });
            });
        };

        return this.instrumentRepository.getIndexComponents(index)
            .then(function(components) {
                return _.map(components, function(instrument) {
                    return self.getExtremasTTL(instrument.symbol, from, to, ttls)
                        .then(function(extremas) {
                            return {
                                instrument: instrument,
                                extremas: extremas[0]
                            };
                        })
                        .then(withAtQuote);
                });
            })
            .then(Promise.all)
            .then(filter)
            .then(function(datas) {
                return _.pluck(datas, 'instrument');
            });
    },

    /**
     * Get extremas calculated by time-to-live.
     * @return promise
     */
    getExtremasTTL: function(symbol, from, to, ttls) {
        return this.quoteRepository.getAsync(symbol, from, to)
            .then(function(quotes) {
                try {
                    var extremas = Series.getExtremasTTL(this._getClosings(quotes), this._getDates(quotes), ttls);

                    return extremas;
                } catch (e) {
                    return Promise.reject(e);
                }
            }.bind(this))
            .catch(function(err) {
                console.error(err);
            });
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
