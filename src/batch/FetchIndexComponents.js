/**
 * This script fetches index components and stores them in db.
 */

var IndexComponentsFetcher = require('../index/IndexComponentsFetcher.js');

var fetcher = new IndexComponentsFetcher();

fetcher.fetchComponentsFromNasdaqOmx('stockholm', function(components) {
    console.log('got components: ' + JSON.stringify(components));

    // Continue to save in db
});
