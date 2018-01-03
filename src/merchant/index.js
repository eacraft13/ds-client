'use strict';

module.exports = function (credentials) {
    var merchant = {};
    var walmart = require('walmart')(credentials.key);

    /**
     * Returns a unique id based on merchant
     * @param {string} merchantName
     * @param {string} merchantId
     */
    merchant.generateId = function (merchantName, merchantId) {
        return merchantName.toLowerCase() + '-' + merchantId;
    };

    /**
     * Returns item based on merchant
     * @param {string} merchantName
     * @param {string} merchantId
     */
    merchant.getItem = function (merchantName, merchantId) {
        if (merchantName.toLowerCase() === 'walmart')
            return walmart
                .getItem(merchantId)
                .then(function (item) {
                    return {
                        merchant: 'Walmart',
                        merchantId: item.product.usItemId,
                        data: item.product
                    };
                });

        return Promise.reject(new Error('Unknown merchant'));
    };

    return merchant;
};
