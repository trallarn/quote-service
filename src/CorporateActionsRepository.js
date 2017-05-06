var moment = require('moment');
var Promise = require('bluebird');
var _ = require('underscore');
var request = require('request-promise');
var csv = require('csv');
var assert = require('assert');

module.exports = CorporateActionsRepository;

/**
 * Repository for corporate actions (företagshändelser) such as splits and dividends.
 */
function CorporateActionsRepository(conf) {
    assert(conf.mongoFactory, 'mongofactory must be set');
    this.mongoFactory = conf.mongoFactory;

    this.urlBase = 'https://ichart.finance.yahoo.com/x?s={symbol}&a={fromMonth}&b={fromDay}&c={fromYear}&d={toMonth}&e={toDay}&f={toYear}&g=v';
}

CorporateActionsRepository.prototype = {

    /**
     * Fetches from API and saves to DB.
     * @param symbols [symbol]
     * @return [Promise<MongoWriteResult>]
     */
    getFromAPIAndSaveToDB: function(symbols) {
        return Promise.all(
            symbols.map(symbol => {
                return this.getFromAPI(symbol)
                    .then(_actions => this.saveToDB(_actions))
                    .catch(e => {
                        console.error('error when getting corporate actions from API for symbol ' + symbol);
                        console.error(e.message);
                    })
            })
        );
    },

    /**
     * Get events from YAHOO.
     * @return promise
     */
    getFromAPI: function(symbol, from = new Date(1900, 0, 0), to = new Date()) {
        var url = this.urlBase.replace('{symbol}', symbol)
            .replace('{fromDay}', from.getDate())
            .replace('{fromMonth}', from.getMonth())
            .replace('{fromYear}', from.getFullYear())
            .replace('{toDay}', to.getDate())
            .replace('{toMonth}', to.getMonth())
            .replace('{toYear}', to.getFullYear());

        console.log('requesting corporate events for ', url);
        return request(url)
            .then(this._convertFromAPI.bind(this, symbol));
    },

    getSplitsFromDB: function(symbol, from, to) {
        if(!symbol) {
            throw 'Missing symbol';
        }
        return this.getFromDB(symbol, from, to, { type: 'SPLIT' });
    },

    getFromDB: function(symbol, from, to, subQuery) {
        return this.mongoFactory.getEquityDb()
            .then(function(db) {
                var query = _.extend({ 
                    symbol: symbol 
                }, subQuery);

                if(from) {
                    query.date = {};
                    query.date.$gte = from;
                }
                if(to) {
                    query.date = query.date || {};
                    query.date.$lt = to;
                }

                console.log('querying splits', query);
                return db.collection('corporateActions').find(query)
                    .toArray();
            });
    },

    saveToDB: function(events) {
        return this.mongoFactory.getEquityDb()
            .then(function(db) {
                var bulk = db.collection('corporateActions').initializeUnorderedBulkOp();

                events.forEach(function(e) {
                    try {
                        bulk.find({
                            symbol: e.symbol,
                            date: e.date
                        }).upsert()
                            .updateOne(e);

                    } catch (e) {
                        console.log(e);
                    }
                });

                console.log('saved corporate actions for ', events[0].symbol);
                return bulk.execute();
            })
            .catch(e => {
                console.log('could not get db', e.message, e.stack);
                throw e;
            });
    },

    /**
     * Converts YAHOO-response to objects.
     * @return promise
     */
    _convertFromAPI: function(symbol, body) {
        var options = {
            comment: '#',
            auto_parse: true,
            auto_parse_date: true,
            columns: ['type', 'date','value']
        };
        
        return new Promise(function(resolve, reject) {
            csv.parse(body, options, function(err, data) {
                if(err) {
                    reject(err);
                }

                var eventsData = _.filter(data, function(el) {
                    return el.value;
                });

                // Set symbol and date
                eventsData.forEach(function(el) { 
                    el.symbol = symbol;
                    el.date = moment.utc(String(el.date)).toDate();
                });

                resolve(eventsData);
            });
        });
    }

};
