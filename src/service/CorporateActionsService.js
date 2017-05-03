'use strict';

var Promise = require('bluebird');
var _ = require('underscore');
var assert = require('assert');

class CorporateActionsService {

    constructor(conf) {
        assert(conf.instrumentRepository, 'Must have instrumentRepository');
        assert(conf.quoteRepository, 'Must have quoteRepository');
        assert(conf.corporateActionsRepository, 'Must have corporateActionsRepository');
        this.quoteRepository = conf.quoteRepository;
        this.instrumentRepository = conf.instrumentRepository;
        this.corporateActionsRepository = conf.corporateActionsRepository;
    }

    /**
     * Gets quote for each symbol where these is a large gap, possibly, 
     * a split that has not yet been adjusted.
     * @return [Promise<[quote,..]>]
     */
    getSymbolsWithLargeGaps(symbols, diffDecimal = 0.40) {
        return Promise.all(
            symbols.map((_symbol) => {
                return this.quoteRepository.getAsync(_symbol)
                    .then(this._shouldAdjust.bind(this, diffDecimal))
                    .then(_found => {
                        if(_found) {
                            console.log(`Symbol with large gap "${_symbol}" at ${_found.date}`);
                        }
                        return _found;
                    })
                    .catch(e => {
                        console.log(`error when finding quotes to adjust for '${_symbol}'`);
                        console.log(e.message);
                        console.log(e.stack);
                    });
            })
        )
        .then(_res => _res.filter(_symbol => !!_symbol));

    }

    /**
     * Calculates if any difference between two adjacene closes is greater than diffDecimal.
     * @param diffDecimal, eg. 0.4 (for 40%)
     * @param quotes [quote]
     * @return quote | undefined
     */
    _shouldAdjust(diffDecimal, quotes) {
        return quotes.find((_el, _i) => {
            if(_i === 0) {
                return false;
            }
            const prevClose = quotes[_i - 1].close;
            //console.log(`comparing ${_el.close} to ${prevClose}`);
            return Math.abs((_el.close - prevClose)) / prevClose >= diffDecimal;
        });
    }

    /**
     * Adjusts daily quotes open, high, low, close values for splits that occurred between from and to dates. Original values will be stored in the orig-field.
     * @param symbol
     * @param from
     * @param to
     */
    adjustDailyForSplits(symbol, from, to) {
        return Promise.all([
            this.quoteRepository.getAsync(symbol),
            this.corporateActionsRepository.getSplitsFromDB(symbol, from, to)
        ]).then(this._adjustQuotesForSplits.bind(this))
            //.then(function(quotes) { console.log('adjusted quotes', quotes); return quotes;} )
            .then(this.quoteRepository.saveDaily.bind(this.quoteRepository))
            .then(() => this.instrumentRepository.updateSplitAdjustmentTS(symbol, new Date()))
            .then(() => true);
    }

    resetQuotesToOrigForSymbols(symbols){
        return Promise.all(
            symbols.map(symbol => {
                return this.quoteRepository.getAsync(symbol)
                    .then(this.resetQuotesToOrig)
                    .then(_quotes => this.quoteRepository.saveDaily(_quotes))
            })
        );
    }

    /**
     * Overwrites values with orig's values.
     * Deletes orig.
     * @return quotes
     */
    resetQuotesToOrig(quotes){

        // Set origin values and remove adjusted
        quotes.forEach(function(quote) {
            _.extend(quote, quote.orig);
            delete quote.orig;
        });

        return quotes;

    }

    _adjustQuotesForSplits([quotes, splits]) {

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

        this.resetQuotesToOrig(adjustedQuotes);

        splits.forEach(function(split) {
            adjustedQuotes = this._adjustForSplit(adjustedQuotes, split);
        }.bind(this));

        return adjustedQuotes;
    }

    /**
     * Adjusts the quotes with the split.
     * @param quotes [quote]
     * @param split {date, value: 'x:y'}
     */
    _adjustForSplit(quotes, split) {
        var valueParts = split.value.split(':');

        if(valueParts.length !== 2) {
            throw 'Invalid split value: "' + JSON.stringify(split) + '"';
        }

        var denominator = Number(valueParts[0]) / Number(valueParts[1]);

        return quotes.map((quote) => {
            var adjQuote = Object.assign({}, quote);

            if(quote.date < split.date) {

                adjQuote.open = quote.open / denominator;
                adjQuote.close = quote.close / denominator;
                adjQuote.high = quote.high / denominator;
                adjQuote.low = quote.low / denominator;

                // Add original values
                adjQuote.orig = {
                    open: quote.open,
                    low: quote.low,
                    high: quote.high,
                    close: quote.close
                };

                //console.log('adjusting quote, old, new ', quote, adjQuote, denominator);
            } 

            return adjQuote;
        });

    }
};

module.exports = CorporateActionsService;
