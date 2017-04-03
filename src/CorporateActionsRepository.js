var Promise = require('promise');
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

    this.urlBase = 'http://ichart.finance.yahoo.com/x?s={symbol}&a={fromMonth}&b={fromDay}&c={fromYear}&d={toMonth}&e={toDay}&f={toYear}&g=v';
}

CorporateActionsRepository.prototype = {

    /**
     * Get events from YAHOO.
     * @return promise
     */
    getFromAPI: function(symbol, from, to) {
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

    getFromDB: function(symbol, from, to) {
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
            .catch(function(err) {
                console.log('could not get db', err);
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

                // Set symbol
                eventsData.forEach(function(el) { 
                    el.symbol = symbol;
                });

                resolve(eventsData);
            });
        });
    }

};
