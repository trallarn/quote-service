var diff = require('../lib/diff.js');
var _ = require('underscore');

var Series = function() {

};

Series.prototype = {

    getAllExtremas: function(ys, xs) {

        var temp = {
            maxY: [],
            minY: [],
            maxX: [],
            minX: []
        };

        // How long should the extrema dominate?
        var dominationPeriod = 1;

        for (var i = 0; i < ys.length; i++) {
            var aBefore = (i - dominationPeriod) >= 0 ? ys[i-dominationPeriod] : false;
            var aLater = (i + dominationPeriod) < ys.length ? ys[i+dominationPeriod] : false;
            var aNow = ys[i];

            if ((!aBefore || aBefore <= aNow) && (!aLater || aNow > aLater)){
                temp.maxY.push(aNow);
                temp.maxX.push(i);
            } else if((!aBefore || aBefore >= aNow) && (!aLater || aNow < aLater)) {
                temp.minY.push(aNow);
                temp.minX.push(i);
            }
        } 

        temp.maxX = _.map(temp.maxX, function(x) { return xs[x]; });
        temp.minX = _.map(temp.minX, function(x) { return xs[x]; });
        return temp;
    },

    _getForIndexes: function(values, indexes) {
        return _.map(indexes, function(i) { return values[i]; });
    },

    /**
     * Gets local min max defined by the time it remains an extreme.
     * @param ttls [ttl1, ttl2, ...] time to live for an extreme
     */
    getExtremasTTL: function(ys, xs, ttls) {
        ttls = ttls || [100];

        ttls = _.map(ttls, Number);

        var getTtlDataModel = function() {
            return {
                ttl: false,
                maxY: [],
                minY: [],
                maxX: [],
                minX: []
            };
        };

        var temp = [];

        // Create result object
        _.each(ttls, function(ttl) { 
            temp.push(_.extend(getTtlDataModel(), { ttl: ttl } )); 
        });

        for(var j = 0; j < ttls.length; j++) {
            var ttl = ttls[j];
            var curTemp = temp[j];

            var yMax;
            var yMin;
            var slice;

            var newSlice = function(i) {
                slice = ys.slice(i - ttl, i + ttl + 1);
            };

            var recalc = function(i) {
                yMax = Math.max.apply(null, slice);
                yMin = Math.min.apply(null, slice);
            };

            newSlice(ttl);
            recalc(ttl);

            for (var i = ttl; i < ys.length - ttl; i++) {

                var y = ys[i];

                if(y === yMax) {
                    curTemp.maxX.push(i);
                } else if(y === yMin) {
                    curTemp.minX.push(i);
                }

                var outY = slice[0];
                var inY = ys[i + ttl + 1];

                newSlice(i + 1);

                if(outY >= yMax || outY <= yMin) {
                    recalc(i + 1);
                } else if(inY >= yMax) {
                    yMax = inY;
                } else if(inY <= yMin) {
                debugger;
                    yMin = inY;
                }

            }

        } 

        _.each(temp, function(curTemp) {
            curTemp.maxY = this._getForIndexes(ys, curTemp.maxX);
            curTemp.minY = this._getForIndexes(ys, curTemp.minX);
            curTemp.maxX = this._getForIndexes(xs, curTemp.maxX);
            curTemp.minX = this._getForIndexes(xs, curTemp.minX);
        }, this);

        return temp;
    },

    /**
     * @param degree 0 means all stationary points, 1 means find extremes of stationary points, 2 etc.
     */
    getExtremasOfDegree: function(ys, xs, degree) {
        degree = degree || 0;

        var all = this.getAllExtremas(ys, xs);
        //console.dir(all);

        for (var i = 0; i < degree; i++) {
            var maxs = this.getAllExtremas(all.maxY, all.maxX);
            var mins = this.getAllExtremas(all.minY, all.minX);
            all.maxX = maxs.maxX;
            all.maxY = maxs.maxY;
            all.minX = mins.minX;
            all.minY = mins.minY;
            //console.dir(all);
        }

        return all;
    },
    
    /**
     * @param epsilonRel as part of last close, eg 0.05 for 5 percent
     */
    getExtremas: function(ys, xs, epsilonRel) {
        var temp = this.getAllExtremas(ys, xs);

        var startsWithBottom = temp.minX[0] < temp.maxX[0];

        var maxX2 = [];

        var maxY2 = _.chain(temp.maxY)
            .map(function(y, i) {
                var diff = y * epsilonRel;
                var bBefore, bAfter;

                if(startsWithBottom) {
                    bBefore = temp.minY[i];
                    bAfter  = temp.minY[i + 1];
                } else {
                    bBefore = temp.minY[i - 1];
                    bAfter  = temp.minY[i];
                }

                return (Math.abs(y - bBefore) > diff) && (Math.abs(y - bAfter) > diff) ? y : null;
            })
            .filter(function(y){
                return y !== null;
            })
            .value();
        
        var result = {
            maxY: [],
            minY: [],
            maxX: [],
            minX: []
        };

console.dir(temp);

        //var reducedMaxX = this._reduceWithEpsilon(temp.maxX, ys, epsilon);
        //var reducedMinX = this._reduceWithEpsilon(temp.minX, ys, epsilon);
        //result.maxX = _.map(reducedMaxX, function(x) { return xs[x]; });
        //result.minX = _.map(reducedMinX, function(x) { return xs[x]; });
        //result.maxY = _.map(reducedMaxX, function(x) { return ys[x]; } );
        //result.minY = _.map(reducedMinX, function(x) { return ys[x]; } );
        result.maxX = _.map(maxY2, function(x) { return xs[x]; });
        result.minX = _.map(reducedMinX, function(x) { return xs[x]; });
        result.maxY = _.map(reducedMaxX, function(x) { return ys[x]; } );
        result.minY = _.map(reducedMinX, function(x) { return ys[x]; } );

        return result;
    },

    _reduceWithEpsilon: function(xValues, ys, epsilon) {
        var resultArray = [];

        var findWithinEpsilon = function(existingXs, x) {
            return _.find(existingXs, function(existingX) {
                return Math.abs(ys[existingX] - ys[x]) <= epsilon;
            });
        };

        _.each(xValues, function(x) {
            var existsWithinEpsilon = findWithinEpsilon(resultArray, x);

            if(!existsWithinEpsilon) {
                resultArray.push(x);
            }

        });

        return resultArray;
    },

    getExtremasWithDiff: function(values, epsilon) {
        epsilon = epsilon || 20;

        var y = values;
        var x = _.range(values.length);

        var extremas = diff.extremaXY(x, y, epsilon);

        var getY = function(interval) { return y[ (interval[0] + interval[1]) / 2]; };

        return {
            minY: _.map(extremas.minlist, getY),
            maxY: _.map(extremas.maxlist, getY),
            minX: extremas.minlist,
            maxX: extremas.maxlist
        };

    }


};

module.exports = new Series();
