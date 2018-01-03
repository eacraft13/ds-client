'use strict';

var _   = require('lodash');
var url = require('url');

module.exports = function (credentials) {
    var amazon = require('./amazon')(credentials.amazon);
    var merchant = {};
    var sears = require('./sears')(credentials.sears);
    var walmart = require('./walmart')(credentials.walmart);

    /**
     * Returns a unique id based on merchant
     * @param {string} merchantName
     * @param {string} merchantId
     */
    merchant.generateId = function (merchantName, merchantId) {
        return merchantName.toLowerCase() + '-' + merchantId;
    };

    /**
     * Returns item based on merchant link
     * @param {string} link
     */
    merchant.getItem = function (link) {
        var merchantId;
        var merchantName;
        var self = this;

        link = url.parse(link);

        merchantName = _.find(link.hostname.split('.'), function(part) {
            return /^(walmart)|(amazon)|(sears)$/i.test(part);
        }).toLowerCase();

        merchantId = _.find(link.pathname.split('/'), function (part) {
            switch (merchantName) {
                case 'amazon':
                    return /^[A-Z0-9]{10}$/.test(part);
                case 'sears':
                    return '';
                case 'walmart':
                    return /^[0-9]{8}$/.test(part);
                default:
                    return null;
            }
        });

        switch (merchantName) {
            case 'walmart':
                return walmart
                    .getItem(merchantId)
                    .then(function (item) {
                        item.id = self.generateId(item.merchantName, item.merchantId);
                        return item;
                    });

            case 'amazon':
                return amazon
                    .getItem(merchantId)
                    .then(function (item) {
                        console.log(item);
                        item.id = self.generateId(item.merchantName, item.merchantId);
                    });

            case 'sears':
                return sears
                    .getItem(merchantId)
                    .then(function (item) {
                        item.id = self.generateId(item.merchantName, item.merchantId);
                    });

            default:
                return Promise.reject(new Error('Unknown merchant'));
        }
    };

    return merchant;
};
