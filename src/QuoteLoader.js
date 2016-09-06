var assert = require('assert');
var _ = require('underscore');

module.exports = QuoteLoader;

/**
 * Fetches quotes from sink and saves to db.
 */
function QuoteLoader(conf) {
    assert(conf.quoteRepository);
    assert(conf.quoteFetcher);

    this.quoteRepository = conf.quoteRepository;
    this.quoteFetcher = conf.quoteFetcher;
};

QuoteLoader.prototype = {

    /**
     * Splits [symbol] into batches [[symbol],..]
     */
    _toBatches: function(symbols) {

        // Split into batches since yahoo handles maximm
        var symbolBatches = [];
        var batchSize = 100;

        for (var i = 0; i < symbols.length; i += batchSize) {
            symbolBatches.push(symbols.slice(i, i + batchSize));
        }

        return symbolBatches;

    },

    /**
     * Fetches historical quotes and saves them to repository.
     * @param symbols [symbol]
     */
    fetchDaily: function(symbols, from, to, callback) {

        var symbolBatches = this._toBatches(symbols);
        var batchCount = 0;
        //var allQuotes = [];

        _.each(symbolBatches, function(symbols) {

            //this.quoteFetcher.fetchDataFromLocalFile(symbols, from, to, function(data) {
            this.quoteFetcher.fetchData(symbols, from, to, function(data) {

                //console.dir(data);

                if(!data) {
                    throw 'Data is empty';
                }

                console.log('Saving quotes for symbols: ' + symbols);

                this.quoteRepository.saveQuotes(data, function(quotes){
                    console.log('saved quotes for ' + symbols);
                    //allQuotes = allQuotes.concat(quotes);
                    batchCount += 1;

                    if(batchCount === symbolBatches.length) {
                        //callback(allQuotes);
                        callback();
                    }
                });
                 
            }.bind(this));
        }, this);

    }

};
