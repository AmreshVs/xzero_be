"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async GetReferHistory(referrer) {
    let referProgram = await strapi
      .query("referral-program")
      .findOne({ status: true });
    let referHistory = await strapi
      .query("referral-code-transaction")
      .find({ referrer: referrer, status: true, _limit: -1 });
    let withdrawalHistory = await strapi
      .query("withdrawal-history")
      .findOne({ user: referrer, status: true, _sort: "id:desc" });
    let totalEarned = referHistory
      .map((refer) => refer.referrer_credit)
      .reduce((a, b) => a + b, 0)
      ? referHistory
          .map((refer) => refer.referrer_credit)
          .reduce((a, b) => a + b, 0)
      : 0;
    let totalAmountDebited = withdrawalHistory
      ? withdrawalHistory.remaining_amount
      : totalEarned;
    let totalReferred = referHistory.length;
    let affiliate = await strapi
      .query("affiliate")
      .findOne({ user: referrer, _sort: "id:desc", status: true });
    let referralCode = affiliate ? affiliate.referral_code : null;

    let label = "affiliate";
    if (affiliate !== null) {
      referProgram.discount = affiliate.discount;
      referProgram.allowed_maximum_discount =
        affiliate.maximum_allowed_discount;
      referProgram.referrer_allowed_maximum_amount =
        affiliate.maximum_allowed_discount;
      if (affiliate.fixed_amount_status === true) {
        referProgram.referrer_allowed_maximum_amount = affiliate.fixed_amount;
      }
    }

    if (referralCode === null) {
      let user = await strapi
        .query("user", "users-permissions")
        .findOne({ id: referrer });
      referralCode = user ? user.referral_code : null;
      label = user ? "referral" : null;
    }
    return {
      referProgram: referralCode ? referProgram : null,
      referralCode: referralCode,
      label: label,
      totalEarned: totalEarned,
      totalReferred: totalReferred,
      balance: totalAmountDebited,
    };
  },
};
