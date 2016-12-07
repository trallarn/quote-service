var diff = require('../lib/diff.js');
var _ = require('underscore');

var Series = function() {

};

Series.prototype = {

    getExtremas: function(values, epsilon) {
        epsilon = epsilon || 20;

        var y = values;
        var x = _.range(values.length);

        var extremas = diff.extremaXY(x, y, epsilon);

        var getY = function(interval) { return y[ (interval[0] + interval[1]) / 2]; };

        return {
            min: _.map(extremas.minlist, getY),
            max: _.map(extremas.maxlist, getY)
        };

    }


};

module.exports = new Series();
