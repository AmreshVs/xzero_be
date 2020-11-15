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
    async SelectRandomUsersForGift() {
        let gifts =  await strapi.query("gift").find();
        let GiftSelectedUserIds = [];
        let GiftEligibleUserIds = [45343,3,31231232,9898];
        GiftSelectedUserIds = _.sampleSize(GiftEligibleUserIds, 2);
        return {GiftSelectedUserIds}
    },


    async GiftAvail(user_id, giftid,) {
        console.log("Here");  return false;

    },

    async GetGiftAdded(condtion) {
        let gifts =  await strapi.query("gift").find();
        return gifts;

        
    }

};
