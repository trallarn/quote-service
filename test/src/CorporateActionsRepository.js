var test = require('tape');

var CorporateActionsRepository = require('../../src/CorporateActionsRepository.js');
var testConf = require('../TestConf');

test('getFromAPI', { skip: testConf.skipIntegrationTest() }, function(t) {

    var repo = new CorporateActionsRepository();

    t.plan(1);

    repo.getFromAPI('ERIC-B.ST', new Date(2008,0,1), new Date(2016,5,10))
        .then(function(events) {
            console.log('events',events);
            t.equals(events.length, 10);
        })
        .catch(function(err) {
            console.log(err);
            t.fail('got error ' + err.reason);
        });
});
