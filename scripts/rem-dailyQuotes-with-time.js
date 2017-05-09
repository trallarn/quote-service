use equity;

db.quotesDaily.find({symbol: 'BOL.ST'}).snapshot().forEach(function(el) {
    if(el.date.getUTCHours() !== 0) {
        db.quotesDaily.remove({ _id: el._id });
    }
});
