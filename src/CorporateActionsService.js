var Promise = require('promise');
var _ = require('underscore');
var assert = require('assert');

module.exports = CorporateActionsService;

/**
 * Adjusts quotes for corporate actions such as splits.
 */
function CorporateActionsService(conf) {
    assert(conf.quoteRepository, 'Must have quoteRepository');
    assert(conf.corporateActionsRepository, 'Must have corporateActionsRepository');

    this.quoteRepository = conf.quoteRepository;
    this.corporateActionsRepository = conf.corporateActionsRepository;
}

CorporateActionsService.prototype = {

    /**
     * Adjusts daily quotes open, high, low, close values for splits that occurred between from and to dates. Original values will be stored in the orig-field.
     * @param symbol
     * @param from
     * @param to
     */
    adjustDailyForSplits: function(symbol, from, to) {
        return Promise.all([
            this.quoteRepository.getAsync(symbol),
            this.corporateActionsRepository.getSplitsFromDB(symbol, from, to)
        ]).then(this._adjustQuotesForSplits.bind(this))
            //.then(function(quotes) { console.log('adjusted quotes', quotes); return quotes;} )
            .then(this.quoteRepository.saveDaily.bind(this.quoteRepository))
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

        if(splits.length === 0) {
            return quotes;
        }

        console.log('adjusting ' + _.first(quotes).symbol + ' for splits', splits);

        var adjustedQuotes = quotes;

        // Set origin values and remove adjusted
        adjustedQuotes.forEach(function(quote) {
            _.extend(quote, quote.orig);
            delete quote.orig;
        });

        splits.forEach(function(split) {
            adjustedQuotes = this._adjustForSplit(adjustedQuotes, split);
        }.bind(this));

        // Add original values
        for(var i = 0; i < adjustedQuotes.length; i++) {
            var q = quotes[i];
            adjustedQuotes[i].orig = {
                open: q.open,
                low: q.low,
                high: q.high,
                close: q.close
            };
        }

        return adjustedQuotes;
    },

    _adjustForSplit: function(quotes, split) {
        var valueParts = split.value.split(':');

        if(valueParts.length !== 2) {
            throw 'Invalid split value: "' + JSON.stringify(split) + '"';
        }

        var denominator = Number(valueParts[0]) / Number(valueParts[1]);

        return _.map(quotes, function(quote) {
            var adjQuote = _.extend({}, quote);

            if(quote.date < split.date) {

                adjQuote.open = quote.open / denominator;
                adjQuote.close = quote.close / denominator;
                adjQuote.high = quote.high / denominator;
                adjQuote.low = quote.low / denominator;
                //console.log('adjusting quote, old, new ', quote, adjQuote, denominator);
            } 

            return adjQuote;
        });

    }

};
