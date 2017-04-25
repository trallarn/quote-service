var Promise = require('bluebird');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Valid envs
const envs = {
    // Connection URL
    dev: {
        url: 'mongodb://localhost:27017/equity'
    },
    // Test equity db
    unittest: {
        url: 'mongodb://localhost:27017/equity-test'
    }
};

// Connected db
let db = false;

// Is connection pending
var pendingConnection = false;

// Waiting for connection
var callbackQueue = [];

/**
 * Connects and call all queued callbacks
 */
function connectToEquityDB (env, callback) {

    if(!envs[env]) {
        throw `Invalid env "${env}". Valid envs: ${envs}`;
    }

    const environment = envs[env];

    console.log(`Using db env "${env}"`);
    callbackQueue.push(callback);
    pendingConnection = true;

    // Use connect method to connect to the Server
    return MongoClient.connect(environment.url)
        .then(lDb => {
            console.log("Connected correctly to mongo db");

            db = lDb;
            pendingConnection = false;
            
            // Call all waiting callbacks
            var cb;
            while(cb = callbackQueue.pop()) {
                cb(db);
            }
        })
        .catch(e => { console.log(e.message); console.log(e.stack); throw e; });
};

module.exports = function(conf = {}) {
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
            var promise = new Promise(function(fullfill, reject) {
                fullfill = callback || fullfill;

                if(db) {
                    fullfill(db);
                } else if(pendingConnection) {
                    callbackQueue.push(fullfill);
                } else {
                    connectToEquityDB(env, fullfill);
                }
            });

            if(callback) {
                promise.then(); // start
            } else {
                return promise;
            }
        },

        closeEquityDb: function() {
            if(db) {
                console.log('Closing db');
                db.close();
                db = false;
            }
        }
    }
};
