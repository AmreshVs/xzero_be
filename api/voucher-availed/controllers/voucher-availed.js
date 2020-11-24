"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require("lodash");
const voucherWinnerEmailTemplate = require("../voucherWinnerEmailTemplate");

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
      user_id: user_id,
      voucher_id: vouchers.id,
      product_ids: vouchers.product_id,
      status: true,
      gift_ids: vouchers.assured_gift_id,
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
        VocherAvailed: voucher_availed,
      };
    }
  },

  async DeclareVoucherWinner(id) {
    let datas = [];
    let vouchers = await strapi
      .query("vouchers")
      .findOne({ status: true, id: id });
    let existingWinner = await strapi
      .query("vouchers")
      .findOne({ status: true, is_won: true });

    //for (var key in vouchers) {
    if (vouchers.draw_status === "declare") {
      let voucherAvailedArray = await strapi
        .query("voucher-availed")
        .find({ status: true, voucher_id: vouchers.id });
      if (voucherAvailedArray !== null && vouchers.draw_status === "progress") {
        let selectVoucher = [].concat(...voucherAvailedArray.map((x) => x.id));
        let winner = _.sampleSize(selectVoucher, 1);
        //disable if the winner if already exist and choose new winner
        await strapi
          .query("voucher-availed")
          .update({ id: existingWinner["id"] }, { is_won: false });
        return await strapi
          .query("voucher-availed")
          .update({ id: winner[0] }, { is_won: true });
      } else if (vouchers.draw_status === "complete") {
        //selecting winner, email function will be here
        let winner = await strapi
          .query("voucher-availed")
          .find({ is_won: true });
        
      }
    }
    //}
  },
};
