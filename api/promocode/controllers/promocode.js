'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    async ApplyPromocode(user, price, promocode) {
        const promoCode = sanitizeEntity(promocode, 'string');
        let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: promoCode, status: true });
        let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: promoCode, user: user, status: true });
        let getPromoCode = await strapi.query("promocode").findOne({ promocode: promoCode, status: true });
    
        let start_date = getPromoCode.start_date ? getPromoCode.start_date: new Date();
        let end_date = getPromoCode.start_date ? getPromoCode.end_date: new Date();
        
        if(new Date().toString() >= start_date && end_date >= start_date && getPromoCode!==null || (getPromoCode.start_date ===null || getPromoCode.end_date === null) )  {
          if( getPromoCodeUsedCountByUser<=getPromoCode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers <= getPromoCode.limit ) {
            let discountAmount = (parseInt(getPromoCode.discount)/parseInt(100)) * parseInt(price);
            discountAmount = (discountAmount <= getPromoCode.allowed_maximum_discount) ? discountAmount: getPromoCode.allowed_maximum_discount; 
            let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
            return { discount: getPromoCode.discount, discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, promoCodeAapplied:promocode }
          } else {
            let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
            return { discount: getPromoCode.discount, discountedPrice: discountedPrice,  discountYouGet: Math.floor(discountAmount), applied: false, promoCodeAapplied:promocode }
          } 
        } else {
          return { applied: false, promoCodeAapplied: "Invalid Promocode" }
        } 
    }
};
