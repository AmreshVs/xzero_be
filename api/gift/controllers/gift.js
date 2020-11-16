'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');

Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

function arrayColumn(array, columnName) {
    return array.map(function(value,index) {
        return value[columnName];
    })
}

module.exports = {
    //Select random gift from a set
    async SelectRandomUsersForGift() {
        let GiftSelectedUserIds = [];
        let gifts =  await strapi.query("gift").find(); 
    
        let user = await strapi.query('user', 'users-permissions').find();


        let userids = await arrayColumn(user, 'id');
        let GiftEligibleUserIds = userids;
        GiftSelectedUserIds = _.sampleSize(GiftEligibleUserIds, 2);
        //console.log(GiftSelectedUserIds); return false;

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
