var request = require("request");
var csv = require('csv');
var _ = require('underscore');

module.exports = function() {

    var url = 'http://real-chart.finance.yahoo.com/table.csv?s={symbol}&a={fm}&b={fd}&c={fy}&d={tm}&e={td}&f={ty}';

    var parseData = function(symbol, data, callback) {
        var options = {
            comment: '#',
            auto_parse: true,
            auto_parse_date: true,
            columns: ['date','open','high','low','close','volume','adj close']
        };

        csv.parse(data, options, function(err, data) {
            if(err) {
                throw 'Error: ' + err;
            }

            _.each(data, function(el) {
                el.symbol = symbol;
            });

            callback(data);
        });
    };

    return {

        fetchData: function(symbol, fromYear, fromMonth, fromDay, toYear, toMonth, toDay, callback) {

            var lUrl = url.replace('{symbol}', symbol)
                .replace('{fy}', fromYear)
                .replace('{fm}', fromMonth)
                .replace('{fd}', fromDay)
                .replace('{ty}', toYear)
                .replace('{tm}', toMonth)
                .replace('{td}', toDay);

            request(lUrl, function(error, response, body) {

                if(error) {
                    console.log(error);
                    throw 'Error: ' + error;
                }

                body = '#' + body;
                parseData(symbol, body, callback);
            });
        }

    };
};
