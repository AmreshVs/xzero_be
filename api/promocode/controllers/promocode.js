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
      
      let code = params.code;
      let plan = params.plan;
      let voucher = params.voucher;
      
      let applied_for = 'membership';
      if( typeof params.voucher !== 'undefined' ) {
        applied_for = 'voucher';
        let membership = await strapi.query("membership").count({ user: receiver });
        let voucher = await strapi.query("vouchers").findOne({ id: params.voucher, status: true });  
        var price = voucher.cost;
        if(voucher.enable_for_non_members === true && membership === 0 ) {
          var price = voucher.cost_for_non_members;
        }
        
      } else if( typeof params.plan !== 'undefined' ) {
        let membershipPlan = await strapi.query("membership-plans").findOne({ id: params.plan, status: true });
        var price = membershipPlan.price;
        
      }

    
      //console.log(applied_for); return false;
      

      let userExistCount = await strapi.query("user", "users-permissions").count({ id: receiver });

      if(userExistCount === 0) {
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
          if(userUsedHistory < referProgram.usage_limit && usedHistory < referProgram.user_can_refer  ) {
              //receiver get
              let discountAmount = (parseInt(referProgram.discount)/100) * parseInt(price);
              if(referProgram.allowed_maximum_discount !== null ) {
                discountAmount = (discountAmount <= referProgram.allowed_maximum_discount) ? discountAmount: referProgram.allowed_maximum_discount; 
              }
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

            if(referProgram.user_can_refer <= 0 || referProgram.usage_limit <= 0) {
              var msg = "User can refer or usage limit is set 0";
            } else {
              var msg = "Invalid referral code!";
            }

            return ctx.badRequest(
              null,
              formatError({
                id: 'applycode.invalid.referralcode',
                message: msg,
              })
            ); 

            //return { applied:false, from: 'referral', codeApplied: referralCode, msg: "Invalid referral code" };
          }
    
        } else if( affiliate !== null &&  ( affiliate.applied_for === applied_for || affiliate.applied_for === "both" )  && affiliate.user.id !== parseInt(receiver)) {
        
          let affiliateAllowedPlan = affiliate.membership_plans.map((membershipPlan) => membershipPlan.id); 
          let affiliateAllowedVouchers = affiliate.vouchers.map((voucher) => voucher.id); 
        
          if(affiliateAllowedVouchers.includes(voucher) && (voucher != "" || typeof voucher !== 'undefined' )) {
            var support = true;
          } else if(affiliateAllowedPlan.includes(plan) && (voucher == ""|| voucher == null || typeof voucher == 'undefined')) {
            var support = true
          } else if(typeof voucher === 'undefined' && typeof plan === 'undefined' || (voucher === null &&  plan === null )) {
            var support = true;
          } else if( affiliateAllowedPlan.length === 0 && affiliateAllowedVouchers.length === 0 ) {
            var support = true;
          } else {
            var support = false;
          }
          
          
          if(support === true) {  

          if(affiliate.type === "limited") {

            let limtedUsers = affiliate.users_for_limited_types.map((affiliateLimited) => affiliateLimited.id);
            if(limtedUsers.includes(receiver)) {

              let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
              let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
            
                if( userUsedHistory < affiliate.allowed_usage_per_user && usedHistory < affiliate.limit ) {
                  let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
                  if(affiliate.maximum_allowed_discount !== null) {
                    discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
                  }
                  
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
                  if(affiliate.limit <= 0 || affiliate.allowed_usage_per_user <= 0 ) {
                    var msg = "Affiliate limit or user limit is set to 0";
                  } else if(userUsedHistory >= affiliate.allowed_usage_per_user) {
                    var msg = "Affiliate user limit exceeded";
                  } else if(usedHistory >= affiliate.limit) {
                    var msg = "Affiliate maximum limit has reached, try again later";
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

                // let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
                // discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 

                let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
                if(affiliate.maximum_allowed_discount !== null) {
                  discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
                }
                
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
            

                if(affiliate.limit <= 0 || affiliate.allowed_usage_per_user <= 0 ) {
                  var msg = "Affiliate limit or user limit is set to 0";
                } else if(userUsedHistory >= affiliate.allowed_usage_per_user) {
                  var msg = "Affiliate user limit exceeded";
                } else if(usedHistory >= affiliate.limit) {
                  var msg = "Affiliate maximum limit has reached, try again later";
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
            } else {
              return ctx.badRequest(
                null,
                formatError({
                  id: 'applycode.affiliateplan.support',
                  message: "Referral code is supported only for specific membership plan",
                })
              ); 
            }
            } else if( promocode !== null && ( promocode.applied_for === applied_for || promocode.applied_for === "both" )) {
          
                let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: referralCode, status: true });
                let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: referralCode, user: receiver, status: true });
                
                let start_date = promocode.start_date ? promocode.start_date: new Date();
                let end_date = promocode.start_date ? promocode.end_date: new Date();
    
            if(new Date().toString() >= start_date && end_date >= start_date || (promocode.start_date === null || promocode.end_date === null) )  {
              if( getPromoCodeUsedCountByUser < promocode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers < promocode.limit ) {
                let discountAmount = (parseInt(promocode.discount)/parseInt(100)) * parseInt(price);
                if(promocode.allowed_maximum_discount !== null) {
                  discountAmount = (discountAmount <= promocode.allowed_maximum_discount) ? discountAmount: promocode.allowed_maximum_discount; 
                }
                
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
               

                if(promocode.limit <= 0 || promocode.maximum_usage_per_user <= 0 ) {
                  var msg = "Promocode limit or user limit is set to 0";
                } else if(getPromoCodeUsedCountByUser>=promocode.maximum_usage_per_user) {
                  var msg = "Promocode user limit exceeded";
                } else if(getPromoCodeUsedCountByAllUsers>=promocode.limit) {
                  var msg = "Promocode maximum limit exceeded, try again later";
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