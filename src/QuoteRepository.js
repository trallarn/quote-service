var fs = require('fs');
var _ = require('underscore');
var glob = require('glob');
var moment = require('moment');
var Promise = require('promise');

var MongoPrinter = require('./mongo/MongoPrinter.js');

module.exports = QuoteRepository;

function QuoteRepository(mongoFactory, options) {
    if(!(this instanceof QuoteRepository)) { return new QuoteRepository(mongoFactory) } else {
        options = options || {};

        // Possible to create test collections
        this.collections = _.extend({
            quotesDaily: 'quotesDaily'
        }, options.collections);

        this.mongoFactory = mongoFactory;
        this.quotesOutputDirectory = 'quotes-raw';
    }
};

QuoteRepository.prototype = {

    _buildQuery: function(symbol, from, to) {
        var query =  {
            symbol: symbol.toUpperCase()
        };

        if(from) {
            if(moment.isMoment(from)) {
                from = from.toDate();
            }

            query.date = { $gte: from };
        }

        if(to) {
            if(moment.isMoment(to)) {
                to = to.toDate();
            }

            query.date = query.date || {};
            query.date.$lte = to;
        }

        console.log('building get query: ' + JSON.stringify(query));

        return query;
    },

    /**
     * @return promise with quote at the given date
     */
    getAt: function(symbol, date) {

        var from = moment(date)
            .subtract(4, 'days')
            .toDate();

        return this.getAsync(symbol, from, date)
            .then(function(quotes) {
                return _.last(quotes);
            });
    },

    /**
     * Get adjusted daily quotes.
     * @return promise
     */
    getAsync: function(symbol, from, to, callback) {
        if(callback) {
            throw "Don't use callback!";
        }
        return this._getQuotesAsync(symbol, from, to, this.collections.quotesDaily);
    },

    /**
     * Get quotes.
     * @return promise
     */
    _getQuotesAsync: function(symbol, from, to, collection) {
        var query = this._buildQuery(symbol, from, to);

        return this.mongoFactory.getEquityDb()
            .then(function(db) {
                return db.collection(collection)
                    .find(query)
                    .sort( { date: 1 } )
                    .toArray();
        });
    },

    flattenQuotes: function(quotes) {

        var flatQuotes;

        if(_.isArray(quotes)) {
            flatQuotes = quotes;
        } else {
            // Add symbol to each quote and flatten
            for(var key in quotes) {
                for(let quote of quotes[key]) {
                    quote.symbol = key;
                };
            }

            flatQuotes = _.reduce(_.keys(quotes), function(memo, key) {
                return memo.concat(quotes[key]);
            }, []);
        }

        return flatQuotes;
    },

    saveDaily: function(quotes, callback) {
        return this._saveDaily(quotes, this.collections.quotesDaily)
            .nodeify(callback);
    },

    /**
     * Saves daily quotes.
     * @param quotes <object|[quote]> from yahoo-finance
     */
    _saveDaily: function(quotes, collection) {
        return this.mongoFactory.getEquityDb()
            .then(function(db){

                var flatQuotes = this.flattenQuotes(quotes);

                if(flatQuotes.length === 0) {
                    console.log('No quotes to save. Skipping.');
                    return;
                } else {
                    var isMissingSymbol = flatQuotes.some(function(quote) {
                        return !quote.symbol;
                    });

                    if(isMissingSymbol) {
                        console.log('missing symbol for some quotes. Skipping.');
                        return;
                    }
                }

                // Unset time zone offset
                _.each(flatQuotes, function(quote) {
                    if(!quote) {
                        console.warn('empty quote, skipping it');
                        return;
                    }

                    if(!_.isDate(quote.date)) {
                        quote.date = new Date(quote.date);
                    }

                    quote.date = moment.utc([quote.date.getFullYear(), quote.date.getMonth(), quote.date.getDate()]).toDate();
                });


                var bulk = db.collection(collection).initializeUnorderedBulkOp();

                console.warn('saving ' + flatQuotes.length + ' quotes to ' + collection);

                _.each(flatQuotes, function(quote) {
                    try {

                        var query = quote['_id'] ? { _id: quote['_id'] } : {
                            symbol: quote.symbol,
                            date: quote.date
                        };

                        bulk.find(query)
                            .upsert()
                            .updateOne(quote);

                    } catch (e) {
                        console.log(e);
                    }

                });

                return bulk.execute()
                    .then(function(result) {
                        console.log(MongoPrinter.getResultSummary(result));
                        return flatQuotes;
                    })
                    .catch(function(err) {
                        console.error(err);
                    });

        }.bind(this));
    },

    saveQuotes: function(quotes, callback) {

        this.saveDaily(quotes, callback);

        // SAVES TO DISC
        //for(var symbol in quotes) {
        //    this.saveQuotesToFile(symbol, quotes[symbol]);
        //}
        //callback();
    },

    saveQuotesToFile: function(symbol, data) {

        if(data.length < 1) {
            console.log('cannot save quotes file for symbol ' + symbol + ' since there are no quotes');
            return;
        } else {
            console.log('saving symbol ' + symbol + ' to  file');
        }

        var from = _.head(data).date;
        var to = _.last(data).date;

        var filename = this.createLocalFilename(symbol, from, to);

        fs.writeFile(filename, JSON.stringify(data), function (err) {
            if (err) return console.log(err);
                console.log('wrote ' + filename);
        });

    },

    createLocalFilename: function(symbol, from, to) {
        var filename = '{dir}/{name}_{from}-{to}.quotes'
            .replace('{dir}', this.quotesOutputDirectory)
            .replace('{name}', symbol)
            .replace('{from}', from ? ''+from.getFullYear()+from.getMonth()+from.getDate() : '*')
            .replace('{to}', to ? ''+to.getFullYear()+to.getMonth()+to.getDate() : '*');

        return filename;
    },

    /**
     * Reads local file with quote data.
     */
    readLocalFile: function(symbol, callback) {
        
        var filename = this.createLocalFilename(symbol);

        glob(filename, {}, function(err, files) {
            if(files.length < 1) {
                console.warn('no file found with name ' + filename);
                callback(false);
                return;
            }

            fs.readFile(files[0], function(err, data) {
                if(err) {
                    console.warn(err);
                }

                callback(JSON.parse(data));
            });

        });

    }
};

