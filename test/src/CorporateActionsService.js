var test = require('tape');

var CorporateActionsRepository = require('../../src/CorporateActionsRepository.js');
var QuoteRepository = require('../../src/QuoteRepository.js');
var CorporateActionsService = require('../../src/CorporateActionsService.js');
var mongoFactory = require('../../src/MongoFactory.js')({env: 'dev'});
var testConf = require('../TestConf');

var buildService = function() {
    return new CorporateActionsService({
        corporateActionsRepository: new CorporateActionsRepository({
            mongoFactory: mongoFactory
        }),
        quoteRepository: new QuoteRepository(mongoFactory, {
            collections: {
                quotesDaily: 'quotesDailyTest',
                quotesDailyRaw: 'quotesDailyRaw'
            }
        }),
    });
};

test('adjustQuotesDaily', { skip: testConf.skipIntegrationTest() }, function(t) {

    var service = buildService();

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
    var service = buildService();

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
