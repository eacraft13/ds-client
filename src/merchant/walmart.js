'use strict';

var _ = require('lodash');

module.exports = function (credentials) {
    var merchant = {};
    var walmart = require('walmart')(credentials.key);

    /**
     * Return walmart item
     * @param {string} id
     */
    merchant.getItem = function (id) {
        return walmart
            .getItem(id)
            .then(function (item) {
                return item.product;
            })
            .then(function (product) {
                return {
                    merchantName: 'Walmart',
                    merchantId: product.usItemId,

                    image: {
                        gallery: product.primaryImageUrl,
                        images: _.map(product.imageAssests, function (asset) {
                            return asset.versions.hero;
                        })
                    },
                    specifics: {
                        title: product.productName,
                        description: product.longDescription,
                        variation: [],
                        specifics: [{
                            name: 'UPC',
                            value: product.upc
                        }, {
                            name: 'Brand',
                            value: product.brand
                        }],
                        isAvailable: product.buyingOptions.available
                    },
                    price: {
                        price: product.buyingOptions.price.currencyAmount,
                        estimatedTax: product.buyingOptions.price.currencyAmount * 0.0845,
                        shippingCost: product.buyingOptions.shippingPrice.currenctyAmount,
                        hasSingleItemAvailable: _.some(product.buyingOptions.quantityOptions, function (option) {
                            return option === 1;
                        })
                    },
                    shipping: {
                        cost: product.buyingOptions.shippingPrice.currenctyAmount,
                        minDeliveryDate: product.buyingOptions.earliestPromiseDeliveryDate,
                        maxDeliveryDate: product.buyingOptions.latestPromiseDeliveryDate
                    },

                    '@merchant': JSON.stringify(product)
                };
            });
    };

    return merchant;
};
