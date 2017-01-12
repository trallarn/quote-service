var test = require('tape');

var mongoFactory = require('../../src/MongoFactory.js')();
var instrumentRepository = require('../../src/InstrumentRepository.js')(mongoFactory);

test.onFinish(function(){
    // Close db
    mongoFactory.closeEquityDb();
});

test('getInstruments', function(t) {
    t.plan(1);

    instrumentRepository.getInstruments()
        .then(function(instruments) {
            t.ok(instruments.length > 0, 'instruments no empty');
        });

});

test('getIndexComponents with stockholm', function(t) {
    t.plan(1);

    instrumentRepository.getIndexComponents('stockholm')
        .then(function(components) {
            t.ok(components.length > 0, 'components not empty');
        });

});

test('getIndexComponents with indices', function(t) {
    t.plan(1);

    instrumentRepository.getIndexComponents('Indices')
        .then(function(components) {
            t.ok(components.length > 0, 'components not empty');
        });

});
