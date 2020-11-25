"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require("lodash");
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

module.exports = {
  // function will add voucher to bought list
  async BuyVoucher(user_id, voucher_id) {
    let vouchers = await strapi.query("vouchers").findOne({ id: voucher_id });
    if(vouchers.total_bought >=  vouchers.limit) {
        await strapi.query("vouchers").update({ id: vouchers.id },
            { draw_status: 'closed'
        });
        return { disabled: true, bought: 'Limit is reached' }
		}
		
    let dataToSave = {
      user: user_id,
      voucher: vouchers.id,
      status: true,
    };

    if (user_id !== null && vouchers !== null) {
      let voucher_availed = await strapi
        .query("voucher-availed")
        .create(dataToSave);

      await strapi
        .query("vouchers")
        .update(
          { id: vouchers.id },
          { total_bought: parseInt(vouchers.total_bought) + 1 }
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
						sendMail(winner.user.id);
						ctx.send('published winner, email is sent');
					}
			}
	}
};
