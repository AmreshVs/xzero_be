'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async BuyVouchers(user_id, voucher_id) {
        //let memberShip = await strapi.query("user").findOne({ id: user_id });
        let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id });
        //console.log(user); return false;
        let vouchers = await strapi.query("vouchers").findOne({ id: voucher_id });
        //console.log(vouchers); return false;

        let dataToSave = { user_id: user_id,
                voucher_id: vouchers.id,
                membership_plan: 1,
                buy_title_en: vouchers.buy_title_en,	
                buy_title_ar: vouchers.buy_title_ar,
                win_title_en: vouchers.win_title_en,
                win_title_ar: vouchers.win_title_ar,
                featured_img: vouchers.featured_img,
                desc_an: vouchers.desc_an,
                desc_ar: vouchers.desc_ar,
                product_ids: vouchers.product_id, 
                gift_ids: vouchers.assured_gift_id };
         
        //console.log(saveData); return false;        
        if( user_id !== null && vouchers !== null ){
            let voucher_availed =  await strapi
            .query("voucher-availed")
                .create( dataToSave );

            // await strapi
            // .query("vouchers")
            //     .update({ id: vouchers.id },
            //     { users_subscribed: vouchers.users_subscribed+1
            // });

            //console.log(voucher_availed); return false;
            return voucher_availed;
        }
    },

};
