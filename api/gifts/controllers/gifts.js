"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require("lodash");

function DateDiffInDaysWithCurrentDate(date) {
  let dt = new Date();
  let localTime = dt.getTime(); 
  let localOffset = dt.getTimezoneOffset(); 
  let utc = localTime + localOffset;
  let offset = 4; // GST (Gulf Standard Time) ahead +4 hours from utc
  let currentDateTime = utc + (3600000*offset); 
  let current = new Date(currentDateTime); 
  const diffTime = Math.abs(current - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}

module.exports = {
    //generate gifts
  async GenerateGift(user_id) {
    if (user_id) {
      let days = 0;
      let memberArray = await strapi
        .query("membership")
        .findOne({ user: user_id });
      let giftArray = await strapi
        .query("gifts")
        .find({ membership_plans: memberArray.package.id, status: true });
      if (memberArray !== null && giftArray !== null) {
        let selectGifts = [].concat(...giftArray.map((gift) => gift.id));
        let shuffledGifts = _.shuffle(
          selectGifts.concat(Array(100-selectGifts.length).fill(0))
        );
        let giftsGotId = _.sampleSize(shuffledGifts, 1);
        let giftAvailedCount = await strapi.query("gift-availed").count({ user: user_id, status: true });

        if(memberArray.gift_generated_date)
        days = DateDiffInDaysWithCurrentDate(new Date(memberArray.gift_generated_date));

        if( days<7 && giftAvailedCount > 0 && memberArray.is_gift_generated === true ) {
          return { disabled: true,  won: false };
        }

        let giftGotDetails = await strapi
          .query("gifts")
          .findOne({ id: giftsGotId[0], status: true });
        if ( 
          giftsGotId[0] > 0 &&
          giftGotDetails.quantity !== null &&
          giftGotDetails.quantity > 0
        ) {
          
          await strapi.query("gift-availed").create({
            name_en: giftGotDetails.name_en,
            name_ar: giftGotDetails.name_ar,
            desc_en: giftGotDetails.desc_en,
            desc_ar: giftGotDetails.desc_ar,
            featured_img: giftGotDetails.featured_img,
            membership_plan: memberArray.package.id,
            user: user_id,
            gift_id: giftsGotId[0],
            status: true,
          });
          let gift = await strapi.query("gifts").update(
            { id: giftsGotId[0] },
            {
              quantity: giftGotDetails.quantity - 1,
            }
          );
          await strapi.query("membership").update(
            { id: memberArray.id },
            {
              is_gift_generated: true,
              gift_generated_date: new Date()
            }
          );

          return { won: true, gift: gift };
        } else {
          return { disabled: false, won: false };
        }
      }
    }
  },

  //function to get gift added
  async AvailableGifts(condtion) {
    let gifts = await strapi
      .query("gifts")
      .find({ status: true, membership_plans: condtion.membership_plan });
    let giftAvailed = await strapi.query("gift-availed").find(condtion);
    return { gifts: gifts, AvailedGifts: giftAvailed };
  },
};
