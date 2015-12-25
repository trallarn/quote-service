var fs = require('fs');

module.exports = function(mongoFactory) {
    return {
        
        saveQuotes: function(quotes, callback) {
            mongoFactory.getEquityDb(function(db){
                db.collection('quotesDaily').insertMany(quotes);
                callback();
            });
        },

        saveQuotesToFile: function(symbol, data) {

            // insert into mongo instead of writing to file
            var filename = symbol+'.quotes';

            fs.writeFile(filename, JSON.stringify(data), function (err) {
                if (err) return console.log(err);
                    console.log('wrote ' + filename);
            });

        }

    };
};
