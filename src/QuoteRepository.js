var fs = require('fs');
var _ = require('underscore');

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
            var cursor = db.collection('quotesDaily').find(query).sort( { date: 1 } );

            cursor.toArray().then(function(items) {
                callback(items);
            });
        });
    },

    /**
     * Saves daily quotes.
     * @param quotes <object|[quote]> from yahoo-finance
     */
    saveDaily: function(quotes, callback) {
        var flatQuotes;

        if(_.isObject(quotes)) {
            // Add symbol to each quote and flatten
            for(var key in quotes) {
                _.each(quotes[key], function(quote) {
                    quote.symbol = key;
                });
            }

            flatQuotes = _.reduce(_.keys(quotes), function(memo, key) {
                return memo.concat(quotes[key]);
            }, []);
        } else {
            flatQuotes = quotes;
        }

        this.mongoFactory.getEquityDb(function(db){
            // Insert many does not handle upserts (updating existing)
            //var ret = db.collection('quotesDaily').insertMany(flatQuotes);

            // Upserts. I guess very slow. Shouldn't use mongo
            _.each(flatQuotes, function(quote) {
                try {
                    var ret = db.collection('quotesDaily').update({ symbol: quote.symbol, date: quote.date }, quote, {upsert: true} );
                    //console.log(ret);
                } catch (e) {
                    console.log(e);
                }

            });

            callback(flatQuotes);
        });
    },

    saveQuotes: function(quotes, callback) {
        this.saveDaily(quotes, callback);
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

