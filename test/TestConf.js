var isIntegrationTest = process.env['INTEGRATION_TEST'] === '1';

module.exports = {
    
    /**
     * To run integration tests use cmd line eg: INTEGRATION_TEST=1 node test/foo.js.
     */
    skipIntegrationTest: function() {
        return !isIntegrationTest;
    }

};

