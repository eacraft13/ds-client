'use strict';

var _      = require('lodash');
var hash   = require('object-hash');
var moment = require('moment');

module.exports = function (credentials) {
    var ebay = {};
    var ebayApi = require('ebay-dev-api')(credentials);

    /**
     * Create variation specific unique id
     * @param {object} item
     * @returns {string}
     */
    ebay.generateId = function (item) {
        var variationHash;

        if (item.Variations)
            variationHash = hash.MD5(item.Variations.Variation);
        else
            variationHash = 0;

        return `${item.ItemID}-${variationHash}`;
    };

    /**
     * Explodes an item into multiple items for each of its variations
     * @param {object} item
     * @returns {array}
     */
    ebay.explodeVariations = function (item) {
        var variations = [];

        if (item.Variations) {
            _.each(item.Variations.Variation, function (variationSpecs) {
                var variation;

                variation = _.assign({}, item, {
                    Variations: {
                        Variation: variationSpecs
                    }
                });

                variations.push(variation);
            });
        } else {
            variations.push(item);
        }

        return variations;
    };

    /**
     * Returns variation based on variation hash of id
     * @param {object} item
     * @return {object}
     */
    ebay.getVariation = function (item, variationHash) {
        var exists;
        var self = this;
        var variations;

        variations = this.explodeVariations(item);

        if (item.Variations) {
            exists = _.find(variations, function (variation) {
                var exploded = self.generateId(variation);
                return _.isEqual(exploded.variationHash, variationHash);
            });

            if (exists)
                return exists;
        }

        return item;
    };

    /**
     * Returns current store listings
     * @returns {Promise}
     */
    ebay.getListings = function () {
        var self = this;

        return ebayApi
            .finding
            .findItemsIneBayStores({ storeName: credentials.storeName })
            .then(function (items) {
                return _.map(items[0].item, function (item) {
                    return { ebay: { finding: item } };
                });
            })
            .then(function (resales) {
                return _.map(resales, function (resale) {
                    return resale.ebay.finding.itemId[0];
                });
            })
            .then(function (ids) {
                return _.uniq(ids);
            })
            .then(function (ids) {
                return self.getItems(ids);
            });
    };

    /**
     * Gets a single item (and its variations) by id
     * @param {string} itemId
     * @returns {Promise}
     */
    ebay.getItem = function (itemId) {
        return this.getItems([itemId]);
    };

    /**
     * Gets multiple items (and their variations) by ids
     * @param {array} itemIds
     * @returns {Promise}
     */
    ebay.getItems = function (itemIds) {
        var self = this;

        return ebayApi
            .shopping
            .getMultipleItems(itemIds)
            .then(function (items) {
                return _.map(items, function (item) {
                    return { ebay: { shopping: item } };
                });
            })
            .then(function (items) {
                return _(items)
                    .map(function (item) {
                        var variations = self.explodeVariations(item.ebay.shopping);

                        return _.map(variations, function (variation) {
                            var clone = _.cloneDeep(item);

                            clone.shopping = variation;
                            clone.id = self.generateId(variation);

                            return clone;
                        });
                    })
                    .flatten()
                    .valueOf();
            })
            .then(function (items) {
                return _.map(items, function (item) {
                    var finding = item.finding;
                    var shopping = item.shopping,
                        variation = _.defaults({}, {
                            SellingStatus: null,
                            StartPrice: null,
                            ItemSpecifics: { NameValueList: [] },
                            VariationSpecifics: { NameValueList: [] }
                        }, shopping.Variations ? shopping.Variations.Variation : {});

                    return {
                        id: item.id,
                        itemId: shopping.ItemID,
                        image: {
                            gallery: shopping.GalleryURL,
                            images: shopping.PictureURL,
                        },
                        specifics: {
                            title: shopping.Title,
                            categoryId: shopping.PrimaryCategoryID,
                            description: shopping.Description,
                            item: _.map(variation.ItemSpecifics.NameValueList, function (list) {
                                return {
                                    name: list.Name,
                                    value: list.Value
                                };
                            }),
                            variation: _.map(variation.VariationSpecifics.NameValueList, function (list) {
                                return {
                                    name: list.Name,
                                    value: list.Value
                                };
                            }),
                            status: shopping.ListingStatus,
                            startTime: moment(shopping.StartTime).valueOf(),
                            endTime: moment(shopping.EndTime).valueOf()
                        },
                        price: {
                            price: variation.StartPrice ? variation.StartPrice.Value : shopping.CurrentPrice.Value,
                            tax: null,
                            shippingCost: shopping.ShippingCostSummary.ShippingServiceCost.Value,
                            quantity: variation.SellingStatus ?
                                variation.SellingStatus.Quantity - variation.SellingStatus.QuantitySold :
                                shopping.Quantity - shopping.QuantitySold
                        },
                        shipping: {
                            cost: shopping.ShippingCostSummary.ShippingServiceCost.Value,
                            handling: shopping.HandlingTime,
                            minDays: null,
                            maxDays: null,
                            isGlobal: shopping.GlobalShipping
                        },
                        profit: {
                            snipeId: null,
                            supplyId: null
                        },
                        hotness: {
                            visits: shopping.HitCount,
                            watchers: null,
                            sold: shopping.QuantitySold
                        },
                        '@ebay': {
                            '@finding': JSON.stringify(finding),
                            '@shopping': JSON.stringify(shopping)
                        }
                    };
                });
            });
    };

    return ebay;
};
