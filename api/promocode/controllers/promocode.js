'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  
    async ApplyCode(ctx) {
      let params = ctx.request.body;
      let receiver = params.receiver;
      let price = params.price;
      let code = params.code
      // receiver, price, code

      let userExistCount = await strapi.query("user", "users-permissions").count({ id: receiver });

      if(userExistCount===0) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'applycode.invalidreceiver',
            message: "user doesn't exist",
          })
        ); 
      }

      let referralCode = sanitizeEntity(code, 'string');
      let userCode = await strapi.query('user', 'users-permissions').findOne({ referral_code: referralCode, enable_refer_and_earn: true });
      
      let affiliate = await strapi.query("affiliate").findOne({ referral_code: referralCode, status: true });
      let referProgram = await strapi.query("referral-program").findOne({ status: true });    
      let promocode = await strapi.query("promocode").findOne({ promocode: referralCode, status: true });

    
       if( referProgram !== null && userCode!==null && userCode.referral_code !== null && userCode.id !== parseInt(receiver)) {
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
            

              return ctx.send({
                discount: referProgram.discount, 
                discountYouGet: discountAmount, 
                discountedPrice: afterDiscount, 
                applied:true, 
                userId: userCode.id, 
                from: 'referral', 
                codeApplied: referralCode, 
                referrerCredit: referrerCredit 
              });

              //return { discount: referProgram.discount , discountYouGet: discountAmount, discountedPrice: afterDiscount, applied:true, userId: userCode.id, from: 'referral', codeApplied: referralCode, referrerCredit: referrerCredit};
              
          } else {

            return ctx.badRequest(
              null,
              formatError({
                id: 'applycode.invalid.referralcode',
                message: 'Invalid referral code!',
              })
            ); 

            //return { applied:false, from: 'referral', codeApplied: referralCode, msg: "Invalid referral code" };
          }
    
        } else if( affiliate !== null && (affiliate.applied_for === "voucher" || affiliate.applied_for === 'both' ) && affiliate.user.id !== parseInt(receiver)) {
          if(affiliate.type === "limited") {
            
            let limtedUsers = affiliate.users_for_limited_types.map((affiliateLimited) => affiliateLimited.id);
            if(limtedUsers.includes(receiver)) {

              let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
              let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
            
                if( userUsedHistory < affiliate.allowed_usage_per_user && usedHistory < affiliate.limit ) {
                  let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
                  discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
                  let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
                  let msg = "success";
                  return ctx.send({
                    applicableFor: affiliate.applied_for, 
                    affiliate_id: affiliate.id, 
                    userId: affiliate.user.id, 
                    discount: affiliate.discount, 
                    from: 'affiliate', 
                    discountedPrice: discountedPrice, 
                    discountYouGet: Math.floor(discountAmount), 
                    applied: true, 
                    codeApplied :referralCode,
                    msg: msg
                  });
  
  
                  //return { ApplicableFor: affiliate.applied_for, affiliate_id: affiliate.id, userId: affiliate.user.id, discount: affiliate.discount, from: 'affiliate', discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, codeApplied :referralCode }
  
                } else {
                  if(userUsedHistory>affiliate.allowed_usage_per_user) {
                    var msg = "Affiliate user limit exceeded";
                  } else {
                    var msg = "Affiliate maximum limit exceeded, try again later";
                  }
  
                  return ctx.badRequest(
                    null,
                    formatError({
                      id: 'applycode.affiliateuser.limit',
                      message: msg,
                    })
                  ); 
  
                  }

            } else {
              
              return ctx.badRequest(
                null,
                formatError({
                  id: 'applycode.affiliateuser.typelimited',
                  message: "Affiliate is limited, check the user for privilege",
                })
              ); 
            }
            

          } else {

            let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
            let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
          
              if( userUsedHistory < affiliate.allowed_usage_per_user && usedHistory < affiliate.limit ) {
                let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
                discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
                let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));

                return ctx.send({
                  applicableFor: affiliate.applied_for, 
                  affiliate_id: affiliate.id, 
                  userId: affiliate.user.id, 
                  discount: affiliate.discount, 
                  from: 'affiliate', 
                  discountedPrice: discountedPrice, 
                  discountYouGet: Math.floor(discountAmount), 
                  applied: true, 
                  codeApplied :referralCode
                });


                //return { ApplicableFor: affiliate.applied_for, affiliate_id: affiliate.id, userId: affiliate.user.id, discount: affiliate.discount, from: 'affiliate', discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, codeApplied :referralCode }

              } else {
                if(userUsedHistory>affiliate.allowed_usage_per_user) {
                  var msg = "Affiliate user limit exceeded";
                } else {
                  var msg = "Affiliate maximum limit exceeded, try again later";
                }

                return ctx.badRequest(
                  null,
                  formatError({
                    id: 'applycode.affiliateuser.limit',
                    message: msg,
                  })
                ); 

                }
                //return { applied: false, codeApplied: referralCode, msg: msg }
              }   
            } else if( promocode !== null && (promocode.applied_for === "voucher" || promocode.applied_for === 'both')) {
          
                let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: referralCode, status: true });
                let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: referralCode, user: receiver, status: true });
                
                let start_date = promocode.start_date ? promocode.start_date: new Date();
                let end_date = promocode.start_date ? promocode.end_date: new Date();
    
            if(new Date().toString() >= start_date && end_date >= start_date || (promocode.start_date === null || promocode.end_date === null) )  {
              if( getPromoCodeUsedCountByUser<=promocode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers <= promocode.limit ) {
                let discountAmount = (parseInt(promocode.discount)/parseInt(100)) * parseInt(price);
                discountAmount = (discountAmount <= promocode.allowed_maximum_discount) ? discountAmount: promocode.allowed_maximum_discount; 
                let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));

                return ctx.send({
                  discount: promocode.discount, 
                  discountedPrice: discountedPrice, 
                  promocodeId: promocode.id,
                  from: 'promocode', 
                  discountYouGet: Math.floor(discountAmount), 
                  applied: true, 
                  codeApplied: referralCode,

                
                });



                //return { discount: promocode.discount, discountedPrice: discountedPrice, from: 'promocode', discountYouGet: Math.floor(discountAmount), applied: true, codeApplied: referralCode }
              } else {
                if(getPromoCodeUsedCountByUser>promocode.maximum_usage_per_user) {
                  var msg = "Promocode user limit exceeded";
                } else {
                  var msg = "Promocode maximum limit exceeded, try again later";
                }

                return ctx.badRequest(
                  null,
                  formatError({
                    id: 'applycode.promocode.limit',
                    message: msg,
                  })
                ); 

                //return { applied: false, codeApplied: referralCode, msg: msg }
              } 
            } else {

              return ctx.badRequest(
                null,
                formatError({
                  id: 'applycode.promocode.expired',
                  message: "Promocode expired",
                })
              ); 

              //return {  applied: false, codeApplied: referralCode, msg: "Promocode expired" }
            } 
        
        } else {
          var msg = "Invalid Code"
          if((userCode!==null && parseInt(receiver) === userCode.id) || (affiliate !== null && parseInt(receiver) === affiliate.user.id)) {
             msg = "Referrer and receiver can'be same";
          } 

          return ctx.badRequest(
            null,
            formatError({
              id: 'applycode.referrererror',
              message: msg,
            })
          ); 

          //return { applied: false, codeApplied: referralCode, msg: msg }
        }
    }

};