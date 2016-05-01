var assert = require('assert');

module.exports = QuoteLoader;

//var symbol = 'ERIC';
//var from = Date(2015, 11 ,1);
//var to = Date(2016, 5 ,1);

function QuoteLoader(conf) {
    assert(conf.quoteRepository);
    assert(conf.quoteFetcher);

    this.quoteRepository = conf.quoteRepository;
    this.quoteFetcher = conf.quoteFetcher;
};

QuoteLoader.prototype = {

    fetchDaily: function(symbol, from, to, callback) {

        console.log('Fetching data for ' + symbol + ' from ' + from.toString() + ' to ' + to.toString());

        this.quoteFetcher.fetchData(symbol, from.getFullYear(), from.getMonth(), from.getDate(), to.getFullYear(), to.getMonth(), to.getDate(), function(data) {

            //console.dir(arguments);

            if(!data) {
                throw 'Data is empty';
            }
                
            this.quoteRepository.saveQuotes(data, function(){
                console.log('saved quotes for ' + symbol);
                //mongoFactory.closeEquityDb();  client is responsible
                
                callback();
            });
             
        }.bind(this));

    }

};
