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


async function ApplyPromocode(user, price, promocode) {
  let promoCode = sanitizeEntity(promocode, 'string');
  let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: promoCode, status: true });
  let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: promoCode, user: user, status: true });
  let getPromoCode = await strapi.query("promocode").findOne({ promocode: promoCode, status: true });
    if(getPromoCode!==null) {
      if(getPromoCode.applied_for === "voucher" || getPromoCode.applied_for === null ) {

    let start_date = getPromoCode.start_date ? getPromoCode.start_date: new Date();
    let end_date = getPromoCode.start_date ? getPromoCode.end_date: new Date();
    
    if(new Date().toString() >= start_date && end_date >= start_date && getPromoCode!==null || (getPromoCode.start_date ===null || getPromoCode.end_date === null) )  {
      if( getPromoCodeUsedCountByUser<=getPromoCode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers <= getPromoCode.limit ) {
        let discountAmount = (parseInt(getPromoCode.discount)/parseInt(100)) * parseInt(price);
        discountAmount = (discountAmount <= getPromoCode.allowed_maximum_discount) ? discountAmount: getPromoCode.allowed_maximum_discount; 
        let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));

        return { discount: getPromoCode.discount, discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, promoCodeAapplied:promocode }

      } else {
        if(getPromoCodeUsedCountByUser>getPromoCode.maximum_usage_per_user) {
          let msg = "Invalid promocode";
          return { applied: false, promoCodeApplied: msg }
        } else {
          let msg = "Maximum limit exceeded, try again later";
          return { applied: false, promoCodeApplied: msg }
        }
        
      } 
    } else {
      return { applied: false, promoCodeApplied: "Promocode expired" }
    } 
      } else {
        return { applied: false, promoCodeApplied: "Promocode is not supported" }
      }
    } else {
      return { applied: false, promoCodeApplied: "Promocode is not found" }
    }
}

module.exports = {
  // function will add voucher to bought list
  async BuyVoucher(user_id, voucher_id, promocode) {
    let voucher = await strapi.query("vouchers").findOne({ id: voucher_id });
    if(voucher.total_bought >=  voucher.limit) {
        await strapi.query("vouchers").update({ id: voucher.id },
            { draw_status: 'closed'
        });
        return { disabled: true, bought: 'Limit is reached' }
		}
    
    let promoCodeDetails = await ApplyPromocode(user_id, voucher.cost, promocode);

    let dataToSave = {
      user: user_id,
      voucher: voucher.id,
      status: true,
      cost: voucher.cost,
      promocode_applied: promocode ? promocode: null, 
      paid_amount: promoCodeDetails.discountedPrice ? promoCodeDetails.discountedPrice: null, 
      discount: promoCodeDetails.discount ? promoCodeDetails.discount: null,
    };

    if (user_id !== null && voucher !== null) {
      let voucher_availed = await strapi
        .query("voucher-availed")
        .create(dataToSave);

        if(promoCodeDetails !== null && promoCodeDetails.applied === true) {
          var promocodeTransactions = { promocode: promocode,
            user: user_id,
            paid_amount: promoCodeDetails.discountedPrice,
            discount: promoCodeDetails.discount,
            applied_for: 'voucher',
            cost:  voucher.cost,
            inserted_id: voucher_availed.id,
            status: true
          }
            await strapi
            .query("promocode-transaction")
            .create(promocodeTransactions);
        } 

      await strapi
        .query("vouchers")
        .update(
          { id: voucher.id },
          { total_bought: parseInt(voucher.total_bought) + 1 }
        );
      return {
        disabled: false,
        bought: "success",
        VoucherAvailed: voucher_availed,
      };
    }
  },

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
