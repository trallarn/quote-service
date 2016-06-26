var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');

module.exports = IndexComponentsFetcher;

function IndexComponentsFetcher() {

    //this.baseUrl = 'http://finance.yahoo.com/q/cp?s=%5E{index}&c={page}';
    //this.index = 'OMXSPI';
    this.baseUrl = 'http://www.nasdaqomxnordic.com/shares/listed-companies/{index}';
    //index = nordic-large-cap | stockholm
}


IndexComponentsFetcher.prototype = {

    fetchComponentsFromNasdaqOmx: function(index, callback) {

        var url = this.baseUrl.replace('{index}', index);

        request(url, function(err, response, body) {
            if(err) {
                throw err;
            }

            var components = this.parseNasdaqOmx(body);
            callback(components);
        }.bind(this));
        
    },

    parseNasdaqOmx: function(body) {
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
