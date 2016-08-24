var _ = require('underscore');

module.exports = InstrumentRepository;

function InstrumentRepository(mongoFactory) {
    if(!(this instanceof InstrumentRepository)) { return new InstrumentRepository(mongoFactory) };

    this.mongoFactory = mongoFactory;
}

_.extend(InstrumentRepository.prototype, {

    /**
     * Saves instruments
     */
    saveInstruments: function(instruments) {
        this.mongoFactory.getEquityDb(function(db){
            db.collection('instruments').insertMany(instruments);
        });
    },

    /**
     * Saves an index.
     */
    saveIndex: function(index) {
        this.mongoFactory.getEquityDb(function(db){
            db.collection('indices').save(index);
        });
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

    getIndexComponents: function(index, callback) {
        this.getOne('indices', { name: index }, function(index) {
            this.getCollection('instruments', callback, { symbol: { $in: index.symbols } });
        }.bind(this))
    },

    getInstruments: function(callback) {
        this.getCollection('instruments', callback);
    },

    getIndices: function(callback) {
        this.getCollection('indices', callback);
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
