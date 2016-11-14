var _ = require('underscore');
var Promise = require('promise');

module.exports = FavoritesRepository;

/**
 * Calculates change for instruments. 
 *
 */
function FavoritesRepository(mongoFactory) {
    if(!(this instanceof FavoritesRepository)) { return new FavoritesRepository(mongoFactory) };

    this.mongoFactory = mongoFactory;
};

FavoritesRepository.prototype = {

    saveGroup: function(group) {
        return new Promise(function(resolve, reject) {
            this.mongoFactory.getEquityDb()
                .then(function(db){
                    console.log('inserting favorites group');
                    db.collection('favorites').insert(group)
                        .then(function(res) {
                            resolve(res.ops[0]);
                        })
                        .catch(reject);
                });
        }.bind(this));
    },

    deleteGroup: function(user, id) {
    }

};

