'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    async ApplyPromocode(user, price, promocode) {
        let promoCode = sanitizeEntity(promocode, 'string');
        let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: promoCode, status: true });
        let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: promoCode, user: user, status: true });
        let getPromoCode = await strapi.query("promocode").findOne({ promocode: promoCode, status: true });
        
        if(getPromoCode !== null) {
          let start_date = getPromoCode.start_date ? getPromoCode.start_date: new Date();
          let end_date = getPromoCode.start_date ? getPromoCode.end_date: new Date();
          
        if(new Date().toString() >= start_date && end_date >= start_date  || (getPromoCode.start_date ===null || getPromoCode.end_date === null) )  {
          if( getPromoCodeUsedCountByUser <= getPromoCode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers <= getPromoCode.limit ) {
            let discountAmount = (parseInt(getPromoCode.discount)/parseInt(100)) * parseInt(price);
            discountAmount = (discountAmount <= getPromoCode.allowed_maximum_discount) ? discountAmount: getPromoCode.allowed_maximum_discount; 
            let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
            return { ApplicableFor: getPromoCode.applied_for, discount: getPromoCode.discount, discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, promoCodeApplied:promocode }
          } else {
            if(getPromoCodeUsedCountByUser>getPromoCode.maximum_usage_per_user) {
              var msg = "User limit exceeded";
            } else {
              var msg = "Maximum limit exceeded, try again later";
            }
            return { applied: false, promoCodeApplied: msg }
          } 
        } else {
          return { ApplicableFor: getPromoCode.applied_for, applied: false, promoCodeApplied: "Promocode is expired" }
        } 
      } else {
        return { applied: false, promoCodeApplied: "Promocode not found" }
      }
    },

    async ApplyCode(receiver, price, referral_code) {
      let referralCode = sanitizeEntity(referral_code, 'string');
      
      let userCode = await strapi.query('user', 'users-permissions').findOne({ referral_code: referral_code, enable_refer_and_earn: true });
      
      let affiliate = await strapi.query("affiliate").findOne({ referral_code: referralCode, status: true });
      let referProgram = await strapi.query("referral-program").findOne({ status: true });    
      let promocode = await strapi.query("promocode").findOne({ promocode: referralCode, status: true });
      
    
       //console.log(userCode.referral_code); return false;
      if( referProgram !== null && userCode!==null && userCode.referral_code !== null ) {
          let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
          let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, from: 'referral' , status: true });
          if(userUsedHistory <= referProgram.usage_limit && usedHistory <= referProgram.user_can_refer  ) {
              //receiver get
              let discountAmount = (parseInt(referProgram.discount)/100) * parseInt(price);
              discountAmount = (discountAmount <= referProgram.allowed_maximum_discount) ? discountAmount: referProgram.allowed_maximum_discount; 
              let afterDiscount = price - Math.floor(discountAmount);
              //sender will get
              let referrerCredit = (parseInt(referProgram.referrer_get)/100) * parseInt(price);  
              referrerCredit = (referrerCredit <= referProgram.referrer_allowed_maximum_amount) ? referrerCredit: referProgram.referrer_allowed_maximum_amount;
    
              return { discount: discountAmount, discountedPrice: afterDiscount, applied:true, from: 'referral', CodeApplied: referral_code, referrerCredit: referrerCredit};
              
          } else {
            return { applied:false, from: 'referral', CodeApplied: referral_code };
          }
    
      } else if( affiliate !== null ) {
    
            let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
            let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
          
              if( userUsedHistory < affiliate.allowed_usage_per_user && usedHistory < affiliate.limit ) {
                let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
                discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
                let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
                return { ApplicableFor: affiliate.applied_for, affiliate_id: affiliate.id, discount: affiliate.discount, from: 'affiliate', discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, CodeApplied :referralCode }
              } else {
                if(userUsedHistory>affiliate.allowed_usage_per_user) {
                  var msg = "User limit exceeded";
                } else {
                  var msg = "Maximum limit exceeded, try again later";
                }
                return { applied: false, CodeApplied: msg }
              }   
        } else if( promocode !== null ) {
          
          let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: referral_code, status: true });
          let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: referral_code, user: receiver, status: true });
          
          let start_date = promocode.start_date ? promocode.start_date: new Date();
          let end_date = promocode.start_date ? promocode.end_date: new Date();
    
            if(new Date().toString() >= start_date && end_date >= start_date || (promocode.start_date === null || promocode.end_date === null) )  {
              if( getPromoCodeUsedCountByUser<=promocode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers <= promocode.limit ) {
                let discountAmount = (parseInt(promocode.discount)/parseInt(100)) * parseInt(price);
                discountAmount = (discountAmount <= promocode.allowed_maximum_discount) ? discountAmount: promocode.allowed_maximum_discount; 
                let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
                return { discount: promocode.discount, discountedPrice: discountedPrice, from: 'promocode', discountYouGet: Math.floor(discountAmount), applied: true, CodeAapplied: promocode }
              } else {
                if(getPromoCodeUsedCountByUser>promocode.maximum_usage_per_user) {
                  var msg = "User limit exceeded";
                } else {
                  var msg = "Maximum limit exceeded, try again later";
                }
                return { applied: false, CodeApplied: msg }
              } 
            } else {
              return {  applied: false, CodeApplied: "Promocode expired", discountedPrice :price  }
            } 
        
        } else {
          return {  applied: false, CodeApplied: "Invalid Code",  }
        }
    }

};