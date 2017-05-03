'use strict';

const test = require('tape');

const testConf = require('../../TestConf');

const moment = require('moment');
let CorporateActionsRepository = require('../../../src/CorporateActionsRepository');
const CorporateActionsService = require('../../../src/service/CorporateActionsService.js');
const mongoFactory = require('../../../src/MongoFactory.js')({ env: 'unittest'});
const quoteRepository = require('../../../src/QuoteRepository.js')(mongoFactory);
const instrumentRepository = require('../../../src/InstrumentRepository.js')(mongoFactory);

test.onFinish(function() {
    mongoFactory.closeEquityDb();
});

const service = new CorporateActionsService({
    instrumentRepository: instrumentRepository,
    quoteRepository: quoteRepository,
    corporateActionsRepository: new CorporateActionsRepository({
        mongoFactory: mongoFactory
    }),
});

/**
 * @return Promise<Collection>
 */
function insertTestData() {
    const setupQuotesDaily = mongoFactory.getEquityDb()
            .then(db => {
                try {
                    db.collection('quotesDaily').drop();
                } catch(e){}

                // Insert test data
                return db.collection('quotesDaily').insertMany([{
                        "date" : Date("1999-12-28T00:00:00Z"),
                        "close" : 6,
                        "symbol" : "ATCO-B.ST",
                    },
                    {
                        "date" : Date("1999-12-29T00:00:00Z"),
                        "close" : 13,
                        "symbol" : "ATCO-B.ST",
                    },{
                        "date" : Date("1999-12-28T00:00:00Z"),
                        "close" : 6,
                        "symbol" : "ERIC-B.ST",
                    },
                    {
                        "date" : Date("1999-12-29T00:00:00Z"),
                        "close" : 7,
                        "symbol" : "ERIC-B.ST",
                    }]);
            });

    const setupCorporateActions = mongoFactory.getEquityDb()
            .then(db => {
                try {
                    db.collection('corporateActions').drop();
                } catch(e){}

                return db.collection('corporateActions').insertMany([{
                    "type" : "SPLIT",
                    "date" : Date("1999-12-29T00:00:00Z"),
                    "value" : "4:1",
                    "symbol" : "ERIC-B.ST"
                }]);
            });

    const setupInstruments = mongoFactory.getEquityDb()
            .then(db => {
                try {
                    db.collection('instruments').drop();
                } catch(e){}

                return db.collection('instruments').insertMany([{
                        "name" : "Ericsson B",
                        "symbol" : "ERIC-B.ST",
                        "currency" : "SEK",
                        "isin" : "SE0000108656",
                        "sector" : "Technology",
                        "nasdaqSymbol" : "ERIC B"
                        }]);
                });

    return Promise.all([setupInstruments, setupQuotesDaily, setupCorporateActions])
        .then(() => console.log('set up test data'))
        .catch(e => {
            console.error(e.message, e.stack);
            throw e;
        });
}

test('getSymbolsWithLargeGaps', { timeout: 1000 }, function(t) {

    const symbols = [ 'ATCO-B.ST', 'ERIC-B.ST' ];
    t.plan(2);
    insertTestData()
        .then(() => service.getSymbolsWithLargeGaps(symbols))
        .then(res => {
            console.log(res);
            t.equals(res.length, 1);
            t.equals(res[0].symbol, symbols[0]);
        })
        .catch(e => test.fail(e.message));
});

test('_shouldAdjust_verifyTrue', function(t) {

    const quotes = [{
        close: 10
    }, {
        close: 15
    }];

    t.plan(1);

    const res = service._shouldAdjust(0.4, quotes);
    t.ok(res, quotes[1]);

});

test('_shouldAdjust_verifyFalse', function(t) {

    const quotes = [{
        close: 10
    }, {
        close: 12
    }];

    t.plan(1);

    const res = service._shouldAdjust(0.4, quotes);
    t.notOk(res);

});

test('adjustQuotesDaily', { timeout: 1000 }, function(t) {

    t.plan(2);

    const symbol = 'ERIC-B.ST';

    insertTestData()
        .then(() => {
            return service.adjustDailyForSplits(symbol);
        })
        .then(ret => {
            t.equal(ret, true);
        })
        .then(() => instrumentRepository.getInstrumentsBySymbols([symbol]))
        .then(_instruments => _instruments[0])
        .then(_instr => t.ok(_instr.splitAdjustmentTS.getTime() > Date.now() - 2000, 'splitAdjustmentTS should be set on instrument'))
        .catch(function(err) {
            console.log('', err, err.stack);
            t.fail();
        });
});

test('adjustQuotesForSplits', function(t) {

    var adjusted = service._adjustQuotesForSplits([[{
        symbol: 'test',
        date: new Date('2015-01-01'),
        open: 10,
        close: 10,
        high: 10,
        low: 10
    },{
        symbol: 'test',
        date: new Date('2015-01-02'),
        open: 10,
        close: 10,
        high: 10,
        low: 10
    }], [{
        type: 'SPLIT',
        date: new Date('2015-01-02'),
        value: '2:1'
    }]]);

    t.plan(3);
    t.equal(adjusted[0].close, 5);
    t.equal(adjusted[1].close, 10);
    t.equal(adjusted[1].orig, undefined);
});
