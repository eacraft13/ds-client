'use strict';

var amazon  = require('./private/amazon');
var ebay    = require('./private/ebay');
var sears   = require('./private/sears');
var walmart = require('./private/walmart');

exports.ebay = require('./src/ebay')(ebay);
exports.merchant = require('./src/merchant')({
    amazon: amazon,
    sears: sears,
    walmart: walmart
});
