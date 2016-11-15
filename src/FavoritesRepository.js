var _ = require('underscore');
var Promise = require('promise');
var mongodb = require('mongodb');

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

    saveGroup: function(group, username) {
        if(!username) {
            throw 'Must supply username';
        }

        return new Promise(function(resolve, reject) {
            this.mongoFactory.getEquityDb()
                .then(function(db){
                    console.log('inserting favorites group: ' + group.name);

                    db.collection('favorites').insert({
                        owner: username,
                        group: group
                    })
                        .then(function(res) {
                            resolve(res.ops[0].group);
                        })
                        .catch(reject);
                });
        }.bind(this));
    },

    getFavorites: function(username) {
        if(!username) {
            throw 'Must supply username';
        }

        return new Promise(function(resolve, reject) {
            this.mongoFactory.getEquityDb()
                .then(function(db){
                    console.log('getting favorites');

                    db.collection('favorites').find({
                        owner: username
                    })
                        .toArray()
                        .then(function(favorites) {
                            console.log('got favorites');
                            resolve(_.map(favorites, function(el) {
                                el.group.id = el._id;
                                return el.group;
                            }));
                        })
                        .catch(reject);
                });
        }.bind(this));
    },

    deleteGroup: function(username, id) {
        if(!username) {
            throw 'Must supply username';
        }

        return this.mongoFactory.getEquityDb()
            .then(function(db){
                return db.collection('favorites').remove({
                    _id: new mongodb.ObjectID(id),
                    owner: username
                })
            });
    }

};

