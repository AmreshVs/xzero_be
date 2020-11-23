'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');
const _ = require('lodash');


module.exports = {

    async AvailableVouchers(condtion) {
        let vouchers = await strapi.query("vouchers").find({ status :1, membership_plans: condtion.membership_plan });
        let VouchersAvailed = await strapi.query("voucher-availed").find(condtion);
        return { vouchers: vouchers, AvailedVouchers: VouchersAvailed };   
    },


    async GenerateVoucherWinner(user_id, plan_id) {
        let datas = [];
        let alluserIds = [];
        let eligibleUsers;
        let memberShipPlan =  await strapi.query('membership-plans').find();
        let vouchers =  await strapi.query('vouchers').find({status: true});
        //console.log(vouchers); return false;
        //let vouchers =  await strapi.query('vouchers').find();
        //console.log(vouchers); return false;
        for (var key in vouchers) {
            if(vouchers[key]['id']>0 && vouchers[key]['draw_status'] === 'progress') {
            //let memberArray = await strapi.query('membership').find({ package: vouchers[key]['id']});
            let voucherAvailedArray = await strapi.query('voucher-availed').find({voucher_id: vouchers[key].id});
            //let vouchers = await strapi.query('vouchers').find({membership_plans: memberShipPlan[key]['id']});
            //console.log(voucherAvailedArray); return false;
            if( voucherAvailedArray!==null && vouchers[key].draw_status ==='progress' ) {

                //let voucherStatus = vouchers.map(x => x.draw_status);
                //luckyUser.map(g=> alluserIds.push(g.id) );
                //let voucherStatusAll = voucherStatus.map(g=> g.draw_status );
                //console.log(voucherStatusAll); return false;
                //let voucherSts = 

                let selectVoucher =  [].concat(...voucherAvailedArray.map(x => x.id));
                let winner =  _.sampleSize(selectVoucher, 1);
                
                //datas[memberShipPlan[key]['name_en']] =  { users:  selectedGroupIds };
                datas[vouchers[key]['buy_title_en']] = selectVoucher;
                datas[vouchers[key]['buy_title_en']]['draw_status'] = vouchers[key]['draw_status'];
                //datas[vouchers[key]['buy_title_en']]['winner'] = winner;
                
                //datas[vouchers[key]['buy_title_en']]['status'] = voucherStatus;
                eligibleUsers =  alluserIds;
             }
        }
        }

        //console.log(datas); return false;
        let VoucherSelectedUser =  _.sampleSize(eligibleUsers, 1);
        
        let finalList = [];
        
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
    },

    async DeclareVoucherWinner(id) {
        let datas = [];
        //let voucher_id = 2;
        let vouchers =  await strapi.query('vouchers').findOne({ status: true, id: id });
        //console.log(vouchers); return false;
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
          //console.log(datas); return false;
        //}
        //return vouchers;
    },

    async FinalizeWinner() {
        console.log("here in finalize in voucher");  return false
        let vouchers = await strapi.query("voucher-availed").findOne();
        return vouchers;
    }
};
