'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    async ApplyReferral(receiver, price, referral_code) {
        let referralTransactions = {};
        let referralCode = sanitizeEntity(referral_code, 'string');
        let referProgram = await strapi.query("referral-program").findOne({ status: true });
        let userReferralCode = await strapi.query('user', 'users-permissions').model.query(qb => { qb.where('referral_code', referralCode), qb.where('enable_refer_and_earn', true), qb.select('referral_code');
            }).fetch();
           let userCode = JSON.stringify(userReferralCode);

         //console.log(userCode.referral_code); return false;
        if(referProgram !== null && userReferralCode!==null && userCode.referral_code !== null) {
            let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
            let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, from: 'referral' , status: true });
            if(userUsedHistory <= referProgram.usage_limit && userUsedHistory === 0 && referProgram.user_can_refer <= usedHistory) {
                //receiver get
                let discountAmount = (parseInt(referProgram.discount)/100) * parseInt(price);
                discountAmount = (discountAmount <= referProgram.allowed_maximum_discount) ? discountAmount: referProgram.allowed_maximum_discount; 
                let afterDiscount = price - Math.floor(discountAmount);
                //sender will get
                let referrerCredit = (parseInt(referProgram.referrer_get)/100) * parseInt(price);  
                referrerCredit = (referrerCredit <= referProgram.referrer_allowed_maximum_amount) ? referrerCredit: referProgram.referrer_allowed_maximum_amount;

                referralTransactions = { discount: discountAmount, discountedPrice: afterDiscount, applied:true, from: 'referral', referralCodeAppliedInfo:"Applied", referrerCredit: referrerCredit};
                return referralTransactions;
            } 

        } else {
            let affiliate = await strapi.query("affiliate").findOne({ referral_code: referralCode, status: true });
            let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
            let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
            
                if( userUsedHistory <= affiliate.allowed_usage_per_user && usedHistory <= affiliate.limit ) {
                  let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
                  discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
                  let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
                  return { ApplicableFor: affiliate.applied_for, discount: affiliate.discount, from: 'affiliate', discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, referralCodeAppliedInfo :referralCode }
                } else {
                  if(userUsedHistory>affiliate.allowed_usage_per_user) {
                    var msg = "User limit exceeded";
                  } else {
                    var msg = "Maximum limit exceeded, try again later";
                  }
                  return { applied: false, referralCodeAppliedInfo: msg }
                }   
        }
         
    },

    async GetReferHistory(referrer) {
        
        let referProgram = await strapi.query("referral-program").findOne({ status: true });   
        let referHistory = await strapi.query('referral-code-transaction').find({ referrer: referrer, status: true, _limit: -1 });
        let withdrawalHistory = await strapi.query("withdrawal-history").findOne({ user: referrer, status: true, _sort: 'id:desc' });
        let totalEarned = referHistory.map(refer => refer.referrer_credit).reduce((a, b) => a + b, 0) ?  referHistory.map(refer => refer.referrer_credit).reduce((a, b) => a + b, 0): 0;
        let totalAmountDebited = withdrawalHistory ? withdrawalHistory.remaining_amount: totalEarned;
        let totalReferred = referHistory.length;

        let affiliate = await strapi.query('affiliate').findOne({ user: referrer });

        let referralCode = affiliate ? affiliate.referral_code : null;

        let label = "affiliate"
        if(affiliate !== null){
          referProgram.discount = affiliate.discount;
          referProgram.allowed_maximum_discount= affiliate.maximum_allowed_discount;
          referProgram.referrer_allowed_maximum_amount = affiliate.maximum_allowed_discount;
          if(affiliate.fixed_amount_status === true) {
            referProgram.referrer_allowed_maximum_amount = affiliate.fixed_amount;
          }
          
        }
        
        if(referralCode === null) {
          let user = await strapi.query('user', 'users-permissions').findOne({ id: referrer });
          referralCode = user ? user.referral_code: null;
          label = user ? "referral":null;
        }
        
        return { referProgram: referralCode? referProgram:null, affiliate: affiliate, referralCode: referralCode, label: label, totalEarned: totalEarned, totalReferred: totalReferred, balance: totalAmountDebited } ;
    }
    
}