/**
 * Dependency injector.
 */

const InstrumentRepository = require('./InstrumentRepository.js');
const CorporateActionsRepository = require('./CorporateActionsRepository');
const QuoteRepository = require('./QuoteRepository.js');
const CorporateActionsService = require('./service/CorporateActionsService.js');
const MongoFactory = require('./MongoFactory.js');

const built = {
    dev: false,
    test: false
};

function build(env) {
    const mongoFactory = MongoFactory(env);

    const instrumentRepository = new InstrumentRepository(mongoFactory);

    const corporateActionsRepository = new CorporateActionsRepository({
        mongoFactory: mongoFactory
    });

    const quoteRepository = new QuoteRepository(mongoFactory);

    const corporateActionsService = new CorporateActionsService({
        instrumentRepository: instrumentRepository,
        corporateActionsRepository: corporateActionsRepository,
        quoteRepository: quoteRepository,
    });

    return { 
        mongoFactory,
        instrumentRepository,
        corporateActionsRepository,
        quoteRepository,
        corporateActionsService,
    };
}

function getForEnv(env) {
    if(Object.keys(built).indexOf(env) === -1){
        throw new Error(`bad env value, supported: [${Object.keys(built)}]`);
    }

    if(!built[env]){
        built[env] = build(env);
    }
    return built[env];
}

module.exports = ({ env }) => {
    return getForEnv(env);
};
