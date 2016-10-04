var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');

module.exports = IndexComponentsFetcher;

function IndexComponentsFetcher() {

    //this.baseUrl = 'http://finance.yahoo.com/q/cp?s=%5E{index}&c={page}';
    //this.index = 'OMXSPI';
    //index = nordic-large-cap | stockholm
}


IndexComponentsFetcher.prototype = {

    getUrl: function(url, callback) {

        request(url, function(err, response, body) {
            if(err) {
                throw err;
            }

            callback(body);
        }.bind(this));
    },

    /**
     * Fetches all listed stockholm companies at nasdaq omx.
     */
    fetchListedCompaniesFromNasdaqOmx: function(index, callback) {
        var baseUrl = 'http://www.nasdaqomxnordic.com/shares/listed-companies/{index}';

        var url = baseUrl.replace('{index}', index);

        this.getUrl(url, function(body) {
            var components = this.parseNasdaqOmxListedCompanies(body);
            callback(components);
        }.bind(this));

    },

    /**
     * Parses the components table on this page:
     * http://www.nasdaqomxnordic.com/index/index_info?Instrument=SE0001775784
     */
    parseNasdaqOmxIndexComponents: function(body) {
        //console.log(body);
        var $ = cheerio.load(body);
        var rows = $('#sharesInIndexTable tr').has('td');

        var components = [];
        rows.each(function(i, row) {
            var $row = $(row);
            var name = $row.find('td a').first().text();

            var rowEls = $row.children();
            var currency = rowEls.first().next().text();

            //console.log('name ' + name + ' currency ' + currency);

            if(name) {
                components.push({
                    name: name,
                    currency: currency
                });
            }
        });

        return components;
    },

    /**
     * Parse compoonents from this page:
     * http://www.nasdaqomxnordic.com/shares/listed-companies/stockholm
     */
    parseNasdaqOmxListedCompanies: function(body) {
        var $ = cheerio.load(body);
        var rows = $('#listedCompanies tr').has('td');

        var components = [];
        rows.each(function(i, row) {
            var $row = $(row);
            var name = $row.find('td a').first().text();

            var rowEls = $row.children();
            var symbol = rowEls.first().next().text();
            var currency = rowEls.first().next().next().text();
            var isin = rowEls.first().next().next().next().text();
            var sector = rowEls.first().next().next().next().next().text();

            //console.log('name ' + name + ' symbol ' + symbol);

            if(symbol) {
                components.push({
                    name: name,
                    symbol: symbol,
                    currency: currency,
                    isin: isin,
                    sector: sector
                });
            }
        });

        return components;
    }
};
