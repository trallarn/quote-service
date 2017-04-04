var Promise = require('promise');
var _ = require('underscore');
var assert = require('assert');

module.exports = CorporateActionsService;

function CorporateActionsService(conf) {
    assert(conf.quoteRepository, 'Must have quoteRepository');
    assert(conf.corporateActionsRepository, 'Must have corporateActionsRepository');

    this.quoteRepository = conf.quoteRepository;
    this.corporateActionsRepository = conf.corporateActionsRepository;
}

CorporateActionsService.prototype = {

    /**
     * Adjusts raw daily quote for splits that occurred between from and to dates.
     * @param symbol
     * @param from
     * @param to
     */
    adjustDailyForSplits: function(symbol, from, to) {
        return Promise.all([
            this.quoteRepository.getRawAsync(symbol),
            this.corporateActionsRepository.getSplitsFromDB(symbol, from, to)
        ]).then(this._adjustQuotesForSplits.bind(this))
            //.then(function(quotes) { console.log('adjusted quotes', quotes); return quotes;} )
            .then(this.quoteRepository.saveDailyAdjusted.bind(this.quoteRepository))
            .then(function() { return true; } );
    },

    _adjustQuotesForSplits: function(params) {
        var quotes = params[0];
        var splits = params[1];

        if(!_.isArray(quotes)) {
            throw 'Invalid quotes';
        }

        if(!_.isArray(splits)) {
            throw 'Invalid splits';
        }

        console.log('adjusting ' + _.first(quotes).symbol + ' for splits', splits);

        var adjustedQuotes = quotes;

        splits.forEach(function(split) {
            adjustedQuotes = this._adjustForSplit(adjustedQuotes, split);
        }.bind(this));

        return adjustedQuotes;
    },

    _adjustForSplit: function(quotes, split) {
        var valueParts = split.value.split(':');

        if(valueParts.length !== 2) {
            throw 'Invalid split value: "' + JSON.stringify(split) + '"';
        }

        var denominator = Number(valueParts[0]) / Number(valueParts[1]);

        var adjustedQuotes = _.map(quotes, function(quote) {
            if(quote.date < split.date) {
                var adjQuote = _.extend({}, quote);

                adjQuote.open = quote.open / denominator;
                adjQuote.close = quote.close / denominator;
                adjQuote.high = quote.high / denominator;
                adjQuote.low = quote.low / denominator;
                //console.log('adjusting quote, old, new ', quote, adjQuote, denominator);
                return adjQuote;
            } else {
                return quote;
            }
        });

        return adjustedQuotes;

    }

};
