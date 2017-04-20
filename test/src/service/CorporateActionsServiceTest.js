'use strict';

const test = require('tape');

const moment = require('moment');
var CorporateActionsRepository = require('../../../src/CorporateActionsRepository');
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
