'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');
const _ = require('lodash');


module.exports = {

    async AvailableVouchers() {
        let vouchers = await strapi.query("vouchers").find({ status :1, membership_plans: condtion.membership_plan });
        let VouchersAvailed = await strapi.query("voucher-availed").find(condtion);
        return { vouchers: vouchers, AvailedVouchers: VouchersAvailed };   
    },

    async BuyVouchers(user_id, voucher_id) {
    
        let memberShip = await strapi.query("membership").findOne({ user: user_id });
        let vouchers = await strapi.query("vouchers").findOne({ id: voucher_id });
        
        if( user_id !== null && vouchers !== null ){
             await strapi
            .query("voucher-availed")
                .create({
                user_id: user_id,
                voucher_id: vouchers.id,
                membership_plan: memberShip.id,
                buy_title_en: vouchers.buy_title_en,	
                buy_title_ar: vouchers.buy_title_ar,
                win_title_en: vouchers.win_title_en,
                win_title_ar: vouchers.win_title_ar,
                featured_img: vouchers.featured_img,
                desc_an: vouchers.desc_an,
                desc_ar: vouchers.desc_ar,
                product_ids: vouchers.product_id, 
                gift_ids: vouchers.assured_gift_id
            });

            await strapi
            .query("vouchers")
                .update({
                user_id: user_id},
                { users_subscribed: users_subscribed+1
            });
        }
    },

    async GenerateVoucherWinner(user_id, plan_id) {

        let datas = [];
        let alluserIds = [];
        let eligibleUsers;
        let memberShipPlan =  await strapi.query('membership-plans').find(user);
        for (var key in memberShipPlan) {
            if(memberShipPlan[key]['id']>0) {
            let memberArray = await strapi.query('membership').find({ package: memberShipPlan[key]['id']});
            let giftArray = await strapi.query('vouchers').find({membership_plan: memberShipPlan[key]['id']});
            if(memberArray!==null && giftArray!==null) {
                let luckyUser = [].concat(...memberArray.map(x => x.user));
                luckyUser.map(g=> alluserIds.push(g.id) );
                let selectedGroupIds = luckyUser.map(g=> g.id );
                let selectVoucher =  [].concat(...giftArray.map(x => x.id));
                 datas[memberShipPlan[key]['name']] =  { users:  selectedGroupIds };
                 datas[memberShipPlan[key]['name']]['vouchers'] = selectVoucher;
                eligibleUsers =  alluserIds;
             }
        }
        }

        // let VoucherSelectedUser =  _.sampleSize(eligibleUsers, 1);
        // let finalList = [];
        
        // for (var impKey in VoucherSelectedUser) {
        //     for(var key in memberShipPlan){
        //         if(memberShipPlan[key]['id']>0) {
        //             if(datas[memberShipPlan[key]['name']].users.includes(VoucherSelectedUser[impKey])) {
        //                 let giftsGotId = _.sampleSize(datas[memberShipPlan[key]['name']].gifts,1)
        //                 var voucherName =  await strapi.query('vouchers').findOne({id: giftsGotId[0]});
        //                 let giftIds =  {user: VoucherSelectedUser[impKey], giftsGotId: giftsGotId[0], giftName: voucherName.name_en, plan: memberShipPlan[key]['name'], planId: memberShipPlan[key]['id'] };
                       
        //                 finalList.push(giftIds);
        //                 await strapi
        //                 .query("voucher-availed")
        //                 .create({
        //                 membership_plan: giftIds.planId,
        //                 user: giftIds.user,
        //                 gift_id: giftIds.giftsGotId[0],
        //                 status: 1,
        //                 });
        //             }
                   
        //         }   
        //     }
        // }
       
        return { won: true, voucher: voucher, disabled: false };
    }
    
};
