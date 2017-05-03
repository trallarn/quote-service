var Promise = require('bluebird');
var _ = require('underscore');

module.exports = InstrumentRepository;

function InstrumentRepository(mongoFactory) {
    if(!(this instanceof InstrumentRepository)) { return new InstrumentRepository(mongoFactory) };

    if(!mongoFactory) {
        throw 'Missing mongoFactory';
    }

    this.mongoFactory = mongoFactory;
}

_.extend(InstrumentRepository.prototype, {

    saveInstrument: function(instrument) {
        return this.saveInstruments([instrument]);
    },

    /**
     * Saves instruments
     */
    saveInstruments: function(instruments) {
        if(!_.isArray(instruments)) {
            throw Error('instruments must be an array');
        }

        return this.mongoFactory.getEquityDb()
            .then(function(db){
                var bulk = db.collection('instruments').initializeUnorderedBulkOp();

                _.each(instruments, function(instrument) {
                    try {

                        var query = {
                            symbol: instrument.symbol
                        };

                        bulk.find(query)
                            .upsert()
                            .updateOne(instrument);

                    } catch (e) {
                        console.log(e);
                    }

                });

                return bulk.execute()
            });
    },

    /**
     * Saves an index.
     */
    saveIndex: function(index) {
        return new Promise(function(fulfill, reject) {
            this.mongoFactory.getEquityDb(function(db){
                db.collection('indices').update({ name: index.name }, { $set: index }, { upsert: true } )
                    .then(function(item) {
                        console.log('saved index: ' + index.name);
                        console.log(JSON.stringify(index));
                        fulfill(item);
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            });
        }.bind(this));
    },

    saveIndexLastFetchDaily: function(index, lastFetchDaily) {
        index.lastFetchDaily = lastFetchDaily;

        this.mongoFactory.getEquityDb(function(db){
            db.collection('indices').save(index);
        });
    },

    getIndexAsync: function(name, callback) {
        this.mongoFactory.getEquityDb(function(db){
            var cursor = db.collection('indices').find({name: name});

            cursor.toArray(function(err, items) {
                if(err) {
                    throw 'Error caught: ' + err;
                }

                callback(items[0]);
            });
        });
    },

    /**
     * @return promise
     */
    getIndexComponents: function(indexName) {

        return this.getOne('indices', { name: indexName })
            .then(function(index) {
                if(!index) {
                    throw 'Invalid index: "' + indexName + '"';
                }

                return this.getCollection('instruments', { symbol: { $in: index.symbols } }, { name: 1 });

            }.bind(this));

    },

    /**
     * Sets the timestamp when the instrument was adjusted for split.
     * @return promise
     */
    updateSplitAdjustmentTS: function(symbol, date) {
        if(!date || Number.isNaN(date.getTime())) {
            throw new Error('invalid date: ' + date);
        }

        return this.getInstrument(symbol)
            .then(_instr => {
                if(!_instr) {
                    return Promise.reject(`Null instrument for symbol '${symbol}'`);
                }
                return _instr;
            })
            .then(_instrument => { 
                _instrument.splitAdjustmentTS = date; 
                return _instrument;
            })
            .then(_instrument => this.saveInstrument(_instrument));
    },

    getInstruments: function(callback) {
        var promise = this.getCollection('instruments');

        if(callback) {
            promise.then(callback);
        }

        return promise;
    },

    /**
     * @param names [name]
     */
    getInstrumentsByNames: function(names, callback) {
        if(!_.isArray(names)) {
            throw 'names must be an array';
        }

        this.getCollection('instruments', { name: { $in: names } } )
            .then(callback);
    },

    /**
     * @param symbols [symbol]
     * @return promise
     */
    getInstrumentsBySymbols: function(symbols) {
        if(!_.isArray(symbols)) {
            throw 'Symbols must be an array';
        }

        return this.getCollection('instruments', { symbol: { $in: symbols } } );
    },

    getInstrument: function(symbol, callback) {
        return this.getOne('instruments', { symbol: symbol }, callback);
    },

    getIndices: function(callback) {
        this.getCollection('indices', {}, { name: 1 } )
            .then(callback);
    },

    getIndex: function(name, callback) {
        this.getOne('indices', { name: name }, callback);
    },

    getOne: function(collectionName, query, callback) {
        var promise = this.mongoFactory.getEquityDb()
            .then(function(db){
                return db.collection(collectionName).findOne(query);
            })
            .catch(function(err) {
                console.error(err);
            });

        if(callback) {
            promise.then(function(item) {
                callback(item);
            });
        } else {
            return promise;
        }
    },

    /**
     * @return promise
     */
    getCollection: function(collectionName, query, sortParams) {
        return this.mongoFactory.getEquityDb()
            .then(function(db){
                var cursor = db.collection(collectionName).find(query);

                if(sortParams) {
                    cursor = cursor.sort(sortParams);
                }

                return cursor.toArray();
            });
    }

});
