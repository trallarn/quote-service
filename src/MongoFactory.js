var db = false;

var connectToDb = function(callback) {

    var MongoClient = require('mongodb').MongoClient
      , assert = require('assert');

    // Connection URL
    var url = 'mongodb://localhost:27017/equity';

    // Use connect method to connect to the Server
    MongoClient.connect(url, function(err, lDb) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        db = lDb;
        callback(db);
    });
};

module.exports = function() {

    return {
        connect: function(callback) {
            this.getEquityDb(callback || function() { console.log('connected to equity db'); });
        },

        getEquityDbSync: function() {
            assert(db, 'call connect before fetching db');
            return db;
        },

        getEquityDb: function(callback) {
            if(!db) {
                connectToDb(callback);
            } else {
                callback(db);
            }
        },

        closeEquityDb: function() {
            if(db) {
                db.close();
            }
        }
    }
};
