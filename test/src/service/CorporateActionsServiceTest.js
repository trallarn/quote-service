'use strict';

const test = require('tape');

const testConf = require('../../TestConf');

const moment = require('moment');
let CorporateActionsRepository = require('../../../src/CorporateActionsRepository');
const CorporateActionsService = require('../../../src/service/CorporateActionsService.js');
const mongoFactory = require('../../../src/MongoFactory.js')();
const quoteRepository = require('../../../src/QuoteRepository.js')(mongoFactory);

test.onFinish(function() {
    console.log('shutting down mongo');
    mongoFactory.closeEquityDb();
});

let service = new CorporateActionsService({
    quoteRepository: quoteRepository,
    corporateActionsRepository: new CorporateActionsRepository({
        mongoFactory: mongoFactory
    }),
});

test('getSymbolsToAdjust', {skip:false}, function(t) {

    const symbols = [ 'AZN.ST', 'BILIA-A.ST', 'ERIC-B.ST' ];

    t.plan(2);

    service.getSymbolsToAdjust(symbols)
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

test('adjustQuotesDaily', { skip: testConf.skipIntegrationTest() }, function(t) {

    t.plan(1);

    service.adjustDailyForSplits('ERIC-B.ST')
        .then(function(ret) {
            t.equal(ret, true);
        })
        .catch(function(err) {
            console.log('', err, err.stack);
            t.fail();
        })
        .finally(function() {
            mongoFactory.closeEquityDb();
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

    t.plan(2);
    t.equal(adjusted[0].close, 5);
    t.equal(adjusted[1].close, 10);
});
