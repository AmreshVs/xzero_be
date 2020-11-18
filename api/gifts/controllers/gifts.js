'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');

module.exports = {
    async GenerateGift(user_id, plan_id) {
        if(plan_id>0 && user_id!=null) {
            let memberArray = await strapi.query('membership').find({ package: plan_id, user: user_id});
            let giftArray = await strapi.query('gifts').find({membership_plans: plan_id});
            if(memberArray!==null && giftArray!==null) {
                let selectGifts =  [].concat(...giftArray.map(gift => gift.id));
                let shuffledGifts = _.shuffle(selectGifts.concat(Array(100-selectGifts.length).fill(0)));
                    let giftsGotId = _.sampleSize(shuffledGifts,1)
                    let giftGotDetails =  await strapi.query('gifts').findOne({id: giftsGotId[0]});
                    if( giftsGotId[0]>0 && giftGotDetails.quantity!==null && giftGotDetails.quantity>0){
                        let giftDetails =  {user: user_id, giftsGotId: giftsGotId[0], giftGotName: giftGotDetails.name_en, featured_img: giftGotDetails.featured_img, planId: plan_id };
                         await strapi
                        .query("gift-availed")
                        .create({
                            membership_plan: giftDetails.planId,
                            user: giftDetails.user,
                            gift_id: giftDetails.giftsGotId,
                            status: 1,
                        });
                        let gift = await strapi
                        .query("gifts")
                        .update(
                          { id: giftsGotId[0] },
                          {
                            quantity: giftGotDetails.quantity-1,
                          }
                        );
                        return {won: true, gift:gift} 
                    } else {
                        let gift = {}; 
                        return {won: false, gift:gift} 

                    }              
             }
        }
        return null
    },
    
    //function to get gift added
    async AvailableGifts(condtion) {
        let gifts =  await strapi.query("gifts").find({status: 1, membership_plans: condtion.membership_plan });
        let giftAvailed = await strapi.query("gift-availed").find(condtion);
        return {gifts: gifts, AvailedGifts: giftAvailed };
    }
};
