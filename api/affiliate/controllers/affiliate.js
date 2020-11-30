'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    async ApplyReferralCode(user, price, referral_code) {
        const referralCode = sanitizeEntity(referral_code, 'string');
        let refferalCodeUsedCountByAllUsers = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
        let refferalCodeUsedCountByUser = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: user, status: true });
        let refferalCode = await strapi.query("affiliate").findOne({ referral_code: referralCode, status: true });

        if(refferalCode) {
            if( refferalCodeUsedCountByUser<=refferalCode.allowed_usage_per_user && refferalCodeUsedCountByAllUsers <= refferalCode.limit ) {
                let discountAmount = (parseInt(refferalCode.discount)/parseInt(100)) * parseInt(price);
                discountAmount = (discountAmount <= refferalCode.maximum_allowed_discount) ? discountAmount: refferalCode.maximum_allowed_discount; 
                let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
                return { ApplicableFor: refferalCode.applied_for, discount: refferalCode.discount, discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, ReferralCodeApplied: referral_code }
              } else {
                if(refferalCodeUsedCountByUser>refferalCode.allowed_usage_per_user) {
                  var msg = "User limit exceeded";
                } else {
                  var msg = "Maximum limit exceeded, try again later";
                }
                return { applied: false, ReferralCodeApplied: msg }
              } 
        } else {
            return { ApplicableFor: refferalCode.applied_for, discount: refferalCode.discount, discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, ReferralCodeApplied: referral_code };
        }  
    }
};
