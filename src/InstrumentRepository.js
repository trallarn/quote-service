var Promise = require('promise');
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

    /**
     * Saves instruments
     */
    saveInstruments: function(instruments) {
        return new Promise(function(fulfill, reject) {
            this.mongoFactory.getEquityDb(function(db){
                db.collection('instruments').insertMany(instruments)
                    .then(fulfill)
                    .catch(reject);
            });
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

    getIndexComponents: function(indexName, callback) {
        this.getOne('indices', { name: indexName }, function(index) {
            if(!index) {
                throw 'Invalid index: "' + indexName + '"';
            }

            this.getCollection('instruments', callback, { symbol: { $in: index.symbols } });
        }.bind(this))
    },

    getInstruments: function(callback) {
        this.getCollection('instruments', callback);
    },

    /**
     * @param names [name]
     */
    getInstrumentsByNames: function(names, callback) {
        if(!_.isArray(names)) {
            throw 'names must be an array';
        }

        this.getCollection('instruments', callback, { name: { $in: names } } );
    },

    /**
     * @param symbols [symbol]
     */
    getInstrumentsBySymbols: function(symbols, callback) {
        if(!_.isArray(symbols)) {
            throw 'Symbols must be an array';
        }

        this.getCollection('instruments', callback, { symbol: { $in: symbols } } );
    },

    getInstrument: function(symbol, callback) {
        this.getOne('instruments', { symbol: symbol }, callback);
    },

    getIndices: function(callback) {
        this.getCollection('indices', callback);
    },

    getIndex: function(name, callback) {
        this.getOne('indices', { name: name }, callback);
    },

    getOne: function(collectionName, query, callback) {
        this.mongoFactory.getEquityDb(function(db){
            var cursor = db.collection(collectionName).findOne(query, function(err, item) {
                if(err) {
                    throw 'Error caught: ' + JSON.stringify(err);
                }

                callback(item);
            });
        });
    },

    getCollection: function(collectionName, callback, query) {
        this.mongoFactory.getEquityDb(function(db){
            var cursor = db.collection(collectionName).find(query);

            cursor.toArray(function(err, items) {
                if(err) {
                    throw 'Error caught: ' + err;
                }

                callback(items);
            });
        });
    }

});
