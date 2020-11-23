'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
module.exports = {
    async BuyVouchers(user_id, voucher_id) {
        let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id });        
        let vouchers = await strapi.query("vouchers").findOne({ id: voucher_id });
        let dataToSave = { user_id: user_id,
                voucher_id: vouchers.id,
                product_ids: vouchers.product_id, 
                status: true,
                gift_ids: vouchers.assured_gift_id };
         
        if( user_id !== null && vouchers !== null ) {
            let voucher_availed =  await strapi
            .query("voucher-availed")
                .create( dataToSave );

            await strapi
            .query("vouchers")
                .update({ id: vouchers.id },
                { total_bought: vouchers.total_bought+1
            });
            return voucher_availed;
        }
    },

    async DeclareVoucherWinner(id) {
        let datas = [];
        let vouchers =  await strapi.query('vouchers').findOne({ status: true, id: id });
        //for (var key in vouchers) {
            if( vouchers.draw_status === 'progress' ) {
            let voucherAvailedArray = await strapi.query('voucher-availed').find({ status:true,  voucher_id: vouchers.id});
            if( voucherAvailedArray!==null && vouchers.draw_status ==='progress' ) {
                let selectVoucher =  [].concat(...voucherAvailedArray.map(x => x.id));
                let winner =  _.sampleSize(selectVoucher, 1);
                datas[vouchers['buy_title_en']] = selectVoucher;
                datas[vouchers['buy_title_en']]['draw_status'] = vouchers.draw_status;
                datas[vouchers['buy_title_en']]['winner'] = winner;
                return await strapi.query("voucher-availed").update({ id: winner[0] }, { is_won: true });
             }
        }
        //}
    }
};
