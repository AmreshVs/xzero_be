"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require("lodash");
const { sanitizeEntity } = require('strapi-utils'); 
const voucherWinnerEmailTemplate = require("../voucherWinnerEmailTemplate");


async function sendMail(user_id) {
  let user = await strapi
    .query("user", "users-permissions")
    .findOne({ id: user_id });
  try {
    let emailTemplate = {};
      emailTemplate = {
        subject: "Congtatulations!. You are selected as winner for voucher draw",
        text: `Thank You for using Xzero App`,
        html: voucherWinnerEmailTemplate,
      };
    // Send an email to the user.
    await strapi.plugins["email"].services.email.sendTemplatedEmail(
      {
        to: 'noufal@xzero.app',
        from: "support@xzero.app",
      },
      emailTemplate
    );
  } catch (err) {
    console.log(err);
  }
}


async function ApplyCode(receiver, price, code) {
  let referralCode = sanitizeEntity(code, 'String');

  let userCode = await strapi.query('user', 'users-permissions').findOne({ referral_code: referralCode, enable_refer_and_earn: true });
  
  let affiliate = await strapi.query("affiliate").findOne({ referral_code: referralCode, status: true });
  
  let referProgram = await strapi.query("referral-program").findOne({ status: true });    
  let promocode = await strapi.query("promocode").findOne({ promocode: referralCode, status: true });
  
  //console.log(userCode.referral_code); return false;
  if( referProgram !== null && userCode!==null && userCode.referral_code !== null && userCode.id !== parseInt(receiver)) {
      let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
      let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, from: 'referral' , status: true });
      if(userUsedHistory <= referProgram.usage_limit && usedHistory < referProgram.user_can_refer )  {
          //receiver get
          let discountAmount = (parseInt(referProgram.discount)/100) * parseInt(price);
          discountAmount = (discountAmount <= referProgram.allowed_maximum_discount) ? discountAmount: referProgram.allowed_maximum_discount; 
          let afterDiscount = price - Math.floor(discountAmount);
          //sender will get
          let referrerCredit = (parseInt(referProgram.referrer_get)/100) * parseInt(price);  
          referrerCredit = (referrerCredit <= referProgram.referrer_allowed_maximum_amount) ? referrerCredit: referProgram.referrer_allowed_maximum_amount;

          return { discount: referProgram.discount, discountYouGet: discountAmount, discountedPrice: afterDiscount, applied:true, userId: userCode.id, from: 'referral', codeApplied: referralCode, referrerCredit: referrerCredit };
      } else {
        return { applied:false, from: 'referral', codeApplied: referralCode, msg: "Invalid referral code" };
      } 

  } else if( affiliate !== null && (affiliate.applied_for === "voucher" || affiliate.applied_for === 'both' ) && affiliate.user !== parseInt(receiver)) {

        let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
        let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
      
          if( userUsedHistory < affiliate.allowed_usage_per_user && usedHistory < affiliate.limit ) {
            let discountAmount = (parseInt(affiliate.discount)/parseInt(100)) * parseInt(price);
            discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
            let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
            return { ApplicableFor: affiliate.applied_for, affiliateId: affiliate.id, discount: affiliate.discount, userId: affiliate.user, from: 'affiliate', discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, codeApplied :referralCode }
          } else {
            if(userUsedHistory>affiliate.allowed_usage_per_user) {
              var msg = "Affiliate user limit exceeded";
            } else {
              var msg = "Affiliate maximum limit exceeded, try again later";
            }
            return { applied: false, codeApplied: referralCode, msg: msg }
          }   
    } else if( promocode !== null && (promocode.applied_for === "voucher" || promocode.applied_for === 'both')) {
      let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: referralCode, status: true });
      let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: referralCode, user: receiver, status: true });
      
      let start_date = promocode.start_date ? promocode.start_date: new Date();
      let end_date = promocode.start_date ? promocode.end_date: new Date();

        if(new Date().toString() >= start_date && end_date >= start_date || (promocode.start_date ===null || promocode.end_date === null) )  {
          if( getPromoCodeUsedCountByUser<=promocode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers <= promocode.limit ) {
            let discountAmount = (parseInt(promocode.discount)/parseInt(100)) * parseInt(price);
            discountAmount = (discountAmount <= promocode.allowed_maximum_discount) ? discountAmount: promocode.allowed_maximum_discount; 
            let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
            return { discount: promocode.discount, discountedPrice: discountedPrice, promocodeId: promocode.id,  from: 'promocode', discountYouGet: Math.floor(discountAmount), applied: true, CodeAapplied: referralCode }
          } else {
            if(getPromoCodeUsedCountByUser>promocode.maximum_usage_per_user) {
              var msg = "Promocode user limit exceeded";
            } else {
              var msg = "Promocode maximum limit exceeded, try again later";
            }
            return { applied: false, codeApplied: referralCode, msg: msg }
          } 
        } else {
          return {  applied: false, codeApplied: referralCode, msg: "Promocode expired" }
        } 
    
    } else {
      var msg = "Invalid code";
      if((affiliate !== null && affiliate.user === parseInt(receiver)) || (userCode !==null && userCode.id === parseInt(receiver))) {
        var msg = "Referrer and receiver can't be same"; 
      }
      return {  applied: false, codeApplied: referralCode, msg: msg }
    }
}



module.exports = {
  // function will add voucher to bought list
  async BuyVoucher(user_id, voucher_id, code) {
    let voucher = await strapi.query("vouchers").findOne({ id: voucher_id });
    if(voucher != null && voucher.total_bought >=  voucher.limit) {
        await strapi.query("vouchers").update({ id: voucher.id },
            { draw_status: 'closed'
        });
        return { disabled: true, bought: 'Limit is reached' }
		}
    
    let afterCodeApply = await ApplyCode(user_id, voucher.cost, code);
    if(code !== null &&  afterCodeApply !== null && afterCodeApply.applied === false) {
      return {
        codeStatus: afterCodeApply.msg,
        disabled: false,
        bought: "false",

      };
    }
    
    let dataToSave = {
      user: user_id,
      voucher: voucher.id,
      status: true,
      cost: voucher.cost,
      promocode_applied: afterCodeApply.applied === true ? code: null, 
      paid_amount: afterCodeApply.discountedPrice ? afterCodeApply.discountedPrice: null, 
      discount: afterCodeApply.discount ? afterCodeApply.discount: null,
    };

    if (user_id !== null && voucher !== null) {
      let voucher_availed = await strapi
        .query("voucher-availed")
        .create(dataToSave);

        if(afterCodeApply !== null && afterCodeApply.applied === true) {
          var codeStatus = "Success";
          if(afterCodeApply.from === "promocode") {
            var promocodeTransactions = { promocode: code,
              user: user_id,
              paid_amount: afterCodeApply.discountedPrice,
              discount: afterCodeApply.discount,
              applied_for: 'voucher',
              cost:  voucher.cost,
              inserted_id: voucher_availed.id,
              status: true
            };
            let promoTransact =  await strapi
              .query("promocode-transaction")
              .create(promocodeTransactions);

              if(promoTransact!==null &&  afterCodeApply.from === "promocode" && afterCodeApply.promocodeId !== null) {
                let promocodeData = await strapi.query("promocode").findOne({ id: afterCodeApply.promocodeId });
                await strapi.query("promocode").update({ id: afterCodeApply.promocodeId },
                  {
                    total_usage: parseInt(promocodeData.total_usage)+1 
                  }
                );
              }

          } else {
            let referralTransactions = { referral_code: code,
              user: user_id,
              paid_amount: afterCodeApply.discountedPrice,
              discount: afterCodeApply.discount,
              applied_for: 'voucher',
              cost: voucher.cost,
              affiliate: afterCodeApply.affiliateId ?  afterCodeApply.affiliateId: null,
              voucher_availed: voucher.id,
              from: afterCodeApply.from,
              referrer: afterCodeApply.userId ? afterCodeApply.userId: null,
              referrer_credit: afterCodeApply.referrerCredit ? afterCodeApply.referrerCredit: null,
              status: true
             }

            let referralTransact =   await strapi
              .query("referral-code-transaction")
              .create(referralTransactions); 

              //update the total usage count in affiliate
              if( referralTransact && afterCodeApply.from === "affiliate" && afterCodeApply.affiliateId !== null ) {
                let affiliateData = await strapi.query("affiliate").findOne({ id: afterCodeApply.affiliateId });
                await strapi.query("affiliate").update({ id: afterCodeApply.affiliateId },
                  {
                    total_usage: parseInt(affiliateData.total_usage)+1 
                  }
                );
              } else if( referralTransact && afterCodeApply.from === "referral" ) {
                let userReferLogExist = await strapi.query("user-referral-log").findOne({ user: afterCodeApply.userId});
                if(!userReferLogExist) {
                  let count = 0;
                  await strapi.query("user-referral-log").create(
                    {
                      user: afterCodeApply.userId,
                      count: count+1 
                    }
                  );
                } else {
                  await strapi.query("user-referral-log").update( {user: afterCodeApply.userId}, 
                    {
                      count: parseInt(userReferLogExist.count)+1 
                    }
                  ); 
                }
              }

          }
        
        } else {
          var codeStatus = afterCodeApply.msg;
        }
      await strapi
        .query("vouchers")
        .update(
          { id: voucher.id },
          { total_bought: parseInt(voucher.total_bought) + 1 }
        );
      return {
        codeStatus: codeStatus,
        disabled: false,
        bought: "success",
        voucherAvailed: voucher_availed,
      };
    }
  },


  //function randomly select a user and would declare as a winner
	DeclareVoucherWinner: async (ctx) => {
		let postData = ctx.request.body;
		let voucher = await strapi
      .query("vouchers")
      .findOne({ status: true, id: postData.id });
		
    let voucherAvailedArray = await strapi
			.query("voucher-availed")
			.find({ status: true, voucher: voucher.id });

      if (voucherAvailedArray !== null && postData.draw_status === "declare") {
				let selectVoucher = [].concat(...voucherAvailedArray.map((voucher_availed) => voucher_availed.id));
				let winner = _.sampleSize(selectVoucher, 1);
				//reverting the exisiting winner
				let existingWinner = await strapi
				.query("voucher-availed")
				.findOne({ status: true, is_won: true });
        await strapi
          .query("voucher-availed")
					.update({ id: existingWinner["id"] }, { is_won: false });
				//end of revert
         await strapi
          .query("voucher-availed")
					.update({ id: winner[0] }, { is_won: true });
					ctx.send('declared winner')
				
      } else if (postData.draw_status === "publish") {
        let winner = await strapi
          .query("voucher-availed")
					.findOne({ is_won: true });
					if(winner) {
						//sendMail(winner.user.id);
						ctx.send('published winner, email is sent');
					}
			}
	}
};
