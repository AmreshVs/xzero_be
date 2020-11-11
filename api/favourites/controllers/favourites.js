'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async AddFavourites(user, offer, plan) {
      if(user === null && offer === null) {
          return false;
      }
      
       centeradd = await strapi
            .query("favourites")
            .create({
              user_id: user_id,
              center: center_id,
              offer_id: offerArray[index],
              transaction_id: trid,
              discounted_price: offersavailable.discounted_price,
              original_price: offersavailable.actual_price,
              discount: offersavailable.discount,
            });

       
    }
};
