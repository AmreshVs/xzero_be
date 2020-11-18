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
    async GenerateGift(user_id) {
        let datas = [];
        let alluserIds = [];
        let eligibleUsers;
        let memberShipPlan =  await strapi.query('membership-plans').find();
        for (var key in memberShipPlan) {
            if(memberShipPlan[key]['id']>0) {
            let memberArray = await strapi.query('membership').find({ package: memberShipPlan[key]['id']});
            let giftArray = await strapi.query('gifts').find({membership_plans: memberShipPlan[key]['id']});
            if(memberArray!==null && giftArray!==null) {
                let luckyUser = [].concat(...memberArray.map(x => x.user));
                luckyUser.map(g=> alluserIds.push(g.id) );
                let selectedGroupIds = luckyUser.map(g=> g.id );
                let selectGifts =  [].concat(...giftArray.map(x => x.id));
                 datas[memberShipPlan[key]['name']] =  { users:  selectedGroupIds };
                 datas[memberShipPlan[key]['name']]['gifts'] = selectGifts;
                eligibleUsers =  alluserIds;
             }
        }
        }

        let GiftSelectedUser =  _.sampleSize(eligibleUsers, 1);
        let finalList = [];
        
        for (var impKey in GiftSelectedUser) {
            for(var key in memberShipPlan){
                if(memberShipPlan[key]['id']>0) {
                    if(datas[memberShipPlan[key]['name']].users.includes(GiftSelectedUser[impKey])) {
                        let giftsGotId = _.sampleSize(datas[memberShipPlan[key]['name']].gifts,1)
                        var giftName =  await strapi.query('gifts').findOne({id: giftsGotId[0]});
                        let giftIds =  {user: GiftSelectedUser[impKey], giftsGotId: giftsGotId[0], giftName: giftName.name_en, plan: memberShipPlan[key]['name'], planId: memberShipPlan[key]['id'] };
                       
                        finalList.push(giftIds);
                        await strapi
                        .query("gift-availed")
                        .create({
                        membership_plan: giftIds.planId,
                        user: giftIds.user,
                        gift_id: giftIds.giftsGotId[0],
                        status: 1,
                        });
                    }
                   
                }   
            }
        }
       
        return {giftDetails:finalList}
    },
    
    // manages gift availed users
    async GiftAvail(user_id, giftid,) {
        console.log("Here");  return false;
    },

    //function to get gift added
    async AvailableGifts(condtion) {
        let gifts =  await strapi.query("gifts").find({status: 1, membership_plans: condtion.membership_plan });
        let giftAvailed = await strapi.query("gift-availed").find(condtion);
        return {gifts: gifts, AvailedGifts: giftAvailed };
    }
};
