var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var db = false;

var connectToDb = function(env, callback) {

    if(env !== 'dev') {
        throw 'Invalid env "' + env + '". Only dev currently supported';
    }

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

module.exports = function(conf) {
    var env = conf.env || 'dev';

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
                connectToDb(env, callback);
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
