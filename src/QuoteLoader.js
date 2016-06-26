var assert = require('assert');

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
     * Fetches historical quotes and saves them to repository.
     * @param symbols [symbol]
     */
    fetchDaily: function(symbols, from, to, callback) {

        this.quoteFetcher.fetchData(symbols, from.getFullYear(), from.getMonth() + 1, from.getDate(), to.getFullYear(), to.getMonth() + 1, to.getDate(), function(data) {

            //console.dir(data);

            if(!data) {
                throw 'Data is empty';
            }
                
            this.quoteRepository.saveQuotes(data, function(quotes){
                console.log('saved quotes for ' + symbols);
                callback(quotes);
            });
             
        }.bind(this));

    }

};
