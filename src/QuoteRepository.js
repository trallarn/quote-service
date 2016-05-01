var fs = require('fs');

module.exports = QuoteRepository;

function QuoteRepository(mongoFactory) {
    if(!(this instanceof QuoteRepository)) { return new QuoteRepository(mongoFactory) };

    this.mongoFactory = mongoFactory;
};

QuoteRepository.prototype = {

    _buildQuery: function(symbol, from, to) {
        var query =  {
            symbol: symbol.toUpperCase()
        };

        if(from) {
            query.date = { $gte: from };
        }

        //if(to) {
        //    query.date = { $lte: to };
        //}

        console.log('get query: ' + JSON.stringify(query));

        return query;
    },

    getAsync: function(symbol, from, to, callback) {
        var query = this._buildQuery(symbol, from, to);

        this.mongoFactory.getEquityDb(function(db) {
            var cursor = db.collection('quotesDaily').find(query);

            cursor.toArray().then(function(items) {
                callback(items);
            });
        });
    },

    // DOES NOT WORK. Must usee asYNC
    get: function(symbol, from, to) {
        var query = this._buildQuery(symbol, from, to);
        console.log('get query: ' + JSON.stringify(query));
        return  this.mongoFactory.getEquityDbSync().collection('quotesDaily').find(query).toArray();
    },

    saveQuotes: function(quotes, callback) {
        this.mongoFactory.getEquityDb(function(db){
            db.collection('quotesDaily').insertMany(quotes);
            callback();
        });
    },

    saveQuotesToFile: function(symbol, data) {

        // insert into mongo instead of writing to file
        var filename = symbol+'.quotes';

        fs.writeFile(filename, JSON.stringify(data), function (err) {
            if (err) return console.log(err);
                console.log('wrote ' + filename);
        });

    }
};

