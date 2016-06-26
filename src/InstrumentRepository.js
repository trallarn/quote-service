var _ = require('underscore');

module.exports = InstrumentRepository;

function InstrumentRepository(mongoFactory) {
    this.mongoFactory = mongoFactory;
}

_.extend(InstrumentRepository.prototype, {

    /**
     * Saves instruments
     */
    saveInstruments: function(instruments) {
        this.mongoFactory.getEquityDb(function(db){
            db.collection('instruments').insertMany(instruments);
        });
    },

    /**
     * Saves an index.
     */
    saveIndex: function(index) {
        this.mongoFactory.getEquityDb(function(db){
            db.collection('indices').save(index);
        });
    }

});
