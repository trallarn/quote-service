var _ = require('underscore');

module.exports = ChangeRepository;

/**
 * Calculates change for instruments. 
 *
 */
function ChangeRepository(quoteRepository, instrumentRepository) {
    if(!(this instanceof ChangeRepository)) { return new ChangeRepository(quoteRepository, instrumentRepository) };

    if(!quoteRepository) {
        throw 'Must supply quoteRepository';
    }
    if(!instrumentRepository) {
        throw 'Must supply instrumentRepository';
    }

    this.quoteRepository = quoteRepository;
    this.instrumentRepository = instrumentRepository;
};

ChangeRepository.prototype = {

    getInstrumentsWithChange: function(index, from, to, callback) {
        if(!(from instanceof Date)) {
            throw 'Must supply from date';
        }

        to = to || new Date();

        var instrumentsWithChange = [];

        /**
         *
         * @param index - is added to instruments if given
         * @param instruments - to calculcate change for
         */
        var onInstruments = function(indexInstruments, instruments) {

            var onInstrumentWithChange = function(instrumentWithChange) {
                instrumentsWithChange.push(instrumentWithChange);

                if(instruments.length === instrumentsWithChange.length) {
                    callback(instrumentsWithChange);
                }

            };

            var addChange = function(instrument, fromQuote, toQuote) {

                var change;

                try {
                    if(!fromQuote) {
                        console.error('cannot calculate change without from quote');
                        change = 'no quote';
                        fromQuote = {};
                    }
                    if(!toQuote) {
                        console.error('cannot calculate change without to quote');
                        change = 'no quote';
                        toQuote = {};
                    }
                        
                    if(!change) {
                        change = (toQuote.close / fromQuote.close - 1) * 100;
                        change = Math.round(change * 100 ) / 100;
                    }
                } catch(e) {
                    console.error('Error in division');
                    change = 'error';
                }

                // Append extra info to instrument
                instrument.extra = {
                    change: {
                        fromQuote: fromQuote,
                        toQuote: toQuote,
                        change: change
                    }
                };

                onInstrumentWithChange(instrument);

            };
        
            if(indexInstruments) {
                // Adds indices to instruments
                instruments = instruments.concat(indexInstruments);
            }

            _.each(instruments, function(instrument) {
                var fromQuotes;
                var toQuotes;
            
                var onQuotes = function(fromOrTo, instrument, quotes) {
                    if(fromOrTo === 'from') {
                        fromQuotes = quotes;
                    } else {
                        toQuotes = quotes;
                    }

                    if(fromQuotes && toQuotes) {
                        addChange(instrument, _.first(fromQuotes), _.last(toQuotes));
                    }
                };

                var padInMillis = 5 * 24 * 3600 * 1000;

                // A few days later if missing the start
                var fromEnd = new Date(from.getTime() + padInMillis);
                this.quoteRepository.getAsync(instrument.symbol, from, fromEnd, onQuotes.bind(this, 'from', instrument));

                // A few days before if missing the start
                var toStart = new Date(to.getTime() - padInMillis);
                this.quoteRepository.getAsync(instrument.symbol, toStart, to, onQuotes.bind(this, 'to', instrument));
            }, this);

        }.bind(this);

        if(index) {
            // Add index
            this.instrumentRepository.getIndex(index, function(indexIndex) {
                this.instrumentRepository.getInstrumentsBySymbols(indexIndex.indexSymbols || [], function(indexInstruments) {

                    this.instrumentRepository.getIndexComponents(index, onInstruments.bind(this, indexInstruments));
                }.bind(this));

            }.bind(this));

        } else {
            this.instrumentRepository.getInstruments(onInstruments.bind(this, false));
        }

    }

};
