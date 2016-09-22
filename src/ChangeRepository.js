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

        var onInstruments = function(instruments) {

            var onInstrumentWithChange = function(instrumentWithChange) {
                instrumentsWithChange.push(instrumentWithChange);
                console.log('pushing');

                if(instruments.length === instrumentsWithChange.length) {
                    callback(instrumentsWithChange);
                }

            };

            var addChange = function(instrument, fromQuote, toQuote) {
                console.log('add change');

                try {
                    var change = (fromQuote.close / toQuote.close - 1) * 100;
                } catch(e) {
                    console.error('Error in division');
                    change = 'error';
                }
                console.log('done change');

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
                        console.log('calling');
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
            this.instrumentRepository.getIndexComponents(index, onInstruments);
        } else {
            this.instrumentRepository.getInstruments(onInstruments);
        }

    }

};
