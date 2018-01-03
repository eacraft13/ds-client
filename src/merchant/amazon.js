'use strict';

var _      = require('lodash');
var amazon = require('amazon-product-api');
var moment = require('moment');

module.exports = function (credentials) {
    var client = amazon.createClient(credentials);
    var merchant = {};

    merchant.getItem = function (id) {
        return client
            .itemLookup({
                idType: 'ASIN',
                itemId: id,
                responseGroup: 'ItemAttributes,Images,OfferFull,SalesRank',
            })
            .then(function (products) {
                return products[0];
            })
            .then(function (product) {
                return {
                    merchantName: 'Amazon',
                    merchantId: product.ASIN[0],

                    image: {
                        gallery: product.LargeImage[0].URL[0],
                        images: _.map(product.ImageSets[0].ImageSet, function (set) {
                            return set.LargeImage[0].URL[0];
                        })
                    },
                    specifics: {
                        title: product.ItemAttributes[0].Title[0],
                        description: product.ItemAttributes[0].Feature.join(';'),
                        variation: [],
                        specifics: [{
                            name: 'UPC',
                            value: product.ItemAttributes[0].UPC[0]
                        }, {
                            name: 'EAN',
                            value: product.ItemAttributes[0].EAN[0]
                        }, {
                            name: 'Brand',
                            value: product.ItemAttributes[0].Brand[0]
                        }],
                        isAvailable: product.Offers[0].Offer[0].OfferListing[0].AvailabilityAttributes[0].AvailabilityType[0] ===
                            'now'
                    },
                    price: {
                        price: +product.ItemAttributes[0].ListPrice[0].Amount / 100,
                        estimatedTax: (+product.ItemAttributes[0].ListPrice[0].Amount / 100) * 0.0845,
                        shippingCost: product.Offers[0].Offer[0].OfferListing[0].IsEligibleForPrime[0] === '1' ?
                            0.00 :
                            null,
                        hasSingleItemAvailable: product.Offers[0].Offer[0].OfferListing[0].AvailabilityAttributes[0].AvailabilityType[0] ===
                            'now'
                    },
                    shipping: {
                        cost: product.Offers[0].Offer[0].OfferListing[0].IsEligibleForPrime[0] === '1' ?
                            0.00 :
                            null,
                        minDeliveryDate: product.Offers[0].Offer[0].OfferListing[0].IsEligibleForPrime[0] === '1' ?
                            moment().add(2, 'days').unix() :
                            null,
                        maxDeliveryDate: product.Offers[0].Offer[0].OfferListing[0].IsEligibleForPrime[0] === '1' ?
                            moment().add(2, 'days').unix() :
                            null
                    },

                    '@merchant': JSON.stringify(product)
                };
            });
    };

    return merchant;
};
