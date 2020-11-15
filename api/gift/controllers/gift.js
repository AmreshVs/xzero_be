'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

module.exports = {
    //Select random gift from a set
    async SelectRandomUsersForGift() {
        let gifts =  await strapi.query("gift").find();
        let GiftSelectedUserIds = [];
        let GiftEligibleUserIds = [23, 67, 34, 44,56,322, 67,23,12,456, 98, 45,32,12,45,56,87];
        GiftSelectedUserIds = _.sampleSize(GiftEligibleUserIds, 2);  
        return {GiftSelectedUserIds}
    },

    // manages gift availed users
    async GiftAvail(user_id, giftid,) {
        console.log("Here");  return false;
    },

    //function to get gift added
    async GetGiftAdded(condtion) {
        let gifts =  await strapi.query("gift").find();
        return gifts;
    }
};
