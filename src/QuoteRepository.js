var fs = require('fs');
var _ = require('underscore');
var glob = require('glob');
var moment = require('moment');
var Promise = require('promise');

module.exports = QuoteRepository;

function QuoteRepository(mongoFactory) {
    if(!(this instanceof QuoteRepository)) { return new QuoteRepository(mongoFactory) };

    this.mongoFactory = mongoFactory;
    this.quotesOutputDirectory = 'quotes-raw';
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

    getAsync: function(symbol, from, to, callback) {
        var query = this._buildQuery(symbol, from, to);

        var promise = this.mongoFactory.getEquityDb()
            .then(function(db) {
                return db.collection('quotesDaily')
                    .find(query)
                    .sort( { date: 1 } )
                    .toArray();
        });

        if(callback) {
            promise.then(callback);
        } 

        return promise;

    },

    flattenQuotes: function(quotes) {

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

        return flatQuotes;
    },

    /**
     * Saves daily quotes.
     * @param quotes <object|[quote]> from yahoo-finance
     */
    saveDaily: function(quotes, callback) {

        var promise = this.mongoFactory.getEquityDb()
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

                    quote.date = new Date(quote.date.getTime() - 60000 * quote.date.getTimezoneOffset());
                });


                var bulk = db.collection('quotesDaily').initializeUnorderedBulkOp();

                _.each(flatQuotes, function(quote) {
                    try {

                        var query = {
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
                        console.log('mongodb res: ' + JSON.stringify(result.toJSON()));
                        return flatQuotes;
                    })
                    .catch(function(err) {
                        console.error(err);
                    });

        }.bind(this));

        if(callback) {
            promise.then(callback);
        }

        return promise;
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

