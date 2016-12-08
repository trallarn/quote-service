var diff = require('../lib/diff.js');
var _ = require('underscore');

var Series = function() {

};

Series.prototype = {

    /**
     * @param epsilonRel as part of last close, eg 0.05 for 5 percent
     */
    getExtremas: function(ys, xs, epsilonRel) {
        if(_.isUndefined(epsilonRel)) {
            throw 'Must supply epsilon';
        }

        var temp = {
            maxY: [],
            minY: [],
            maxX: [],
            minX: []
        };

        var epsilon = _.last(ys) * epsilonRel;

        // Continue here. How long should the extrema dominate?
        var dominationPeriod = 1;

        for (var i = ys.length - dominationPeriod - 1; i >= dominationPeriod; i--) {
            var aBefore = ys[i-dominationPeriod];
            var aLater = ys[i+dominationPeriod];
            var aNow = ys[i];

            if (aBefore < aNow && aNow > aLater){
                temp.maxY.push(aNow);
                temp.maxX.push(i);
            } else if(aBefore > aNow && aNow < aLater) {
                temp.minY.push(aNow);
                temp.minX.push(i);
            }
        } 

        var result = {
            maxY: [],
            minY: [],
            maxX: [],
            minX: []
        };

        var reduceWithEpsilon = function(xValues) {
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
        };

console.dir(temp);

        var reducedMaxX = reduceWithEpsilon(temp.maxX);
        var reducedMinX = reduceWithEpsilon(temp.minX);
        result.maxX = _.map(reducedMaxX, function(x) { return xs[x]; });
        result.minX = _.map(reducedMinX, function(x) { return xs[x]; });
        result.maxY = _.map(reducedMaxX, function(x) { return ys[x]; } );
        result.minY = _.map(reducedMinX, function(x) { return ys[x]; } );

        return result;
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
