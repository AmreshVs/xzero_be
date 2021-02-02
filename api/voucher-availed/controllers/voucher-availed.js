"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const voucherWinnerEmailTemplate = require("../voucherWinnerEmailTemplate");

const fetch = require("node-fetch");

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

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
        to: user.email,
        from: "support@xzero.app",
      },
      emailTemplate
    );
  } catch (err) {
    console.log(err);
  }
}

//apply code
async function ApplyCode(receiver, price, code, voucher) {
  let userExistCount = await strapi
    .query("user", "users-permissions")
    .count({ id: receiver });

  if (code === null) {
    return { applied: false, msg: "No code used" };
  } else if (userExistCount === 0) {
    return { applied: false, msg: "User doesn't exist" };
  }

  let referralCode = sanitizeEntity(code, "String");

  let userCode = await strapi
    .query("user", "users-permissions")
    .findOne({ referral_code: referralCode, enable_refer_and_earn: true });

  let affiliate = await strapi
    .query("affiliate")
    .findOne({ referral_code: referralCode, status: true });

  let referProgram = await strapi
    .query("referral-program")
    .findOne({ status: true });
  let promocode = await strapi
    .query("promocode")
    .findOne({ promocode: referralCode, status: true });

  if (
    referProgram !== null &&
    userCode !== null &&
    userCode.referral_code !== null &&
    userCode.id !== parseInt(receiver)
  ) {
    let usedHistory = await strapi
      .query("referral-code-transaction")
      .count({ referral_code: referralCode, status: true });
    let userUsedHistory = await strapi
      .query("referral-code-transaction")
      .count({
        referral_code: referralCode,
        user: receiver,
        from: "referral",
        status: true,
      });
    if (
      userUsedHistory < referProgram.usage_limit &&
      (usedHistory < referProgram.user_can_refer ||
        referProgram.user_can_refer === null)
    ) {
      //receiver get
      let discountAmount =
        (parseFloat(referProgram.discount) / 100) * parseFloat(price);
      discountAmount =
        discountAmount <= referProgram.allowed_maximum_discount
          ? discountAmount
          : referProgram.allowed_maximum_discount;
      let afterDiscount =
        parseFloat(price) - parseFloat(discountAmount.toFixed(2));
      //sender will get
      let referrerCredit =
        (parseFloat(referProgram.referrer_get) / 100) * parseFloat(price);
      referrerCredit =
        referrerCredit <= referProgram.referrer_allowed_maximum_amount
          ? referrerCredit
          : referProgram.referrer_allowed_maximum_amount;

      return {
        discount: referProgram.discount? referProgram.discount.toFixed(2): 0,
        discountYouGet: discountAmount? discountAmount.toFixed(2): 0,
        discountedPrice: afterDiscount? afterDiscount.toFixed(2): 0,
        applied: true,
        userId: userCode.id,
        from: "referral",
        codeApplied: referralCode,
        referrerCredit: referrerCredit? referrerCredit.toFixed(2): 0,
      };
    } else {
      if (referProgram.user_can_refer <= 0 || referProgram.usage_limit <= 0) {
        var msg = "User can refer or usage limit is set to 0";
      } else {
        var msg = "Invalid referral code";
      }
      return {
        applied: false,
        from: "referral",
        codeApplied: referralCode,
        msg: msg,
      };
    }
  } else if (
    affiliate !== null &&
    (affiliate.applied_for === "voucher" || affiliate.applied_for === "both") &&
    affiliate.user.id !== parseInt(receiver)
  ) {
    let affiliateAllowedVouchers = affiliate.vouchers.map(
      (voucher) => voucher.id
    );

    if (affiliateAllowedVouchers.includes(voucher)) {
      var support = true;
    } else if (affiliateAllowedVouchers.length === 0) {
      var support = true;
    } else {
      var support = false;
    }

    if (support === true) {
      if (affiliate.type === "limited") {
        let limtedUsers = affiliate.users_for_limited_types.map(
          (affiliateLimited) => affiliateLimited.id
        );

        if (limtedUsers.includes(parseInt(receiver))) {
          let usedHistory = await strapi
            .query("referral-code-transaction")
            .count({ referral_code: referralCode, status: true });
          let userUsedHistory = await strapi
            .query("referral-code-transaction")
            .count({
              referral_code: referralCode,
              user: receiver,
              status: true,
            });

          if (
            userUsedHistory < affiliate.allowed_usage_per_user &&
            usedHistory < affiliate.limit
          ) {
            let discountAmount =
              (parseFloat(affiliate.discount) / parseFloat(100)) *
              parseFloat(price);
            discountAmount =
              discountAmount <= affiliate.maximum_allowed_discount
                ? discountAmount
                : affiliate.maximum_allowed_discount;
            let discountedPrice =
              parseFloat(price) - parseFloat(discountAmount.toFixed(2));

            if (affiliate.fixed_amount_status === true) {
              var affiliateCredit = affiliate.fixed_amount;
            } else {
              var affiliateCredit =
                discountAmount <= affiliate.maximum_allowed_discount
                  ? discountAmount
                  : affiliate.maximum_allowed_discount;
            }

            return {
              referrerCredit: affiliateCredit? affiliateCredit.toFixed(2): 0,
              applicableFor: affiliate.applied_for,
              affiliateId: affiliate.id,
              discount: affiliate.discount? affiliate.discount.toFixed(2): 0,
              userId: affiliate.user.id,
              from: "affiliate",
              discountedPrice: discountedPrice? discountedPrice.toFixed(2): 0,
              discountYouGet: discountAmount? discountAmount.toFixed(2): 0,
              applied: true,
              codeApplied: referralCode,
            };
          } else {
            if (affiliate.limit <= 0 || affiliate.allowed_usage_per_user <= 0) {
              var msg = "Affiliate limit or user limit is set to 0";
            } else if (userUsedHistory >= affiliate.allowed_usage_per_user) {
              var msg = "Affiliate user limit exceeded";
            } else if (usedHistory >= affiliate.limit) {
              var msg = "Affiliate maximum limit exceeded, try again later";
            } else {
              var msg = "Affiliate maximum limit exceeded, try again later";
            }
            return { applied: false, codeApplied: referralCode, msg: msg };
          }
        } else {
          return {
            applied: false,
            codeApplied: referralCode,
            msg: "affiliate is limited type, please check the user privilege",
          };
        }
      } else {
        let usedHistory = await strapi
          .query("referral-code-transaction")
          .count({ referral_code: referralCode, status: true });
        let userUsedHistory = await strapi
          .query("referral-code-transaction")
          .count({ referral_code: referralCode, user: receiver, status: true });

        if (
          userUsedHistory < affiliate.allowed_usage_per_user &&
          usedHistory < affiliate.limit
        ) {
          let discountAmount =
            (parseFloat(affiliate.discount) / parseFloat(100)) *
            parseFloat(price);
          if (affiliate.maximum_allowed_discount !== null) {
            discountAmount =
              discountAmount <= affiliate.maximum_allowed_discount
                ? discountAmount
                : affiliate.maximum_allowed_discount;
          }
          let discountedPrice =
            parseFloat(price) - parseFloat(discountAmount.toFixed(2));

          if (affiliate.fixed_amount_status === true) {
            var affiliateCredit = affiliate.fixed_amount;
          } else {
            var affiliateCredit =
              discountAmount <= affiliate.maximum_allowed_discount
                ? discountAmount
                : affiliate.maximum_allowed_discount;
          }

          return {
            referrerCredit: affiliateCredit? affiliateCredit.toFixed(2): 0,
            applicableFor: affiliate.applied_for,
            affiliateId: affiliate.id,
            discount: affiliate.discount? affiliate.discount.toFixed(2): 0,
            userId: affiliate.user.id,
            from: "affiliate",
            discountedPrice: discountedPrice? discountedPrice.toFixed(2): 0,
            discountYouGet: discountAmount? discountAmount.toFixed(2): 0,
            applied: true,
            codeApplied: referralCode,
          };
        } else {
          if (affiliate.limit <= 0 || affiliate.allowed_usage_per_user <= 0) {
            var msg = "Affiliate limit or user limit is set to 0";
          } else if (userUsedHistory >= affiliate.allowed_usage_per_user) {
            var msg = "Affiliate user limit exceeded";
          } else if (usedHistory >= affiliate.limit) {
            var msg = "Affiliate maximum limit exceeded, try again later";
          } else {
            var msg = "Affiliate maximum limit exceeded, try again later";
          }
          return { applied: false, codeApplied: referralCode, msg: msg };
        }
      }
    } else {
      return {
        applied: false,
        codeApplied: referralCode,
        msg: "Affiliate code is supported only for specific voucher",
      };
    }
  } else if (
    promocode !== null &&
    (promocode.applied_for === "voucher" || promocode.applied_for === "both")
  ) {
    let getPromoCodeUsedCountByAllUsers = await strapi
      .query("promocode-transaction")
      .count({ promocode: referralCode, status: true });
    let getPromoCodeUsedCountByUser = await strapi
      .query("promocode-transaction")
      .count({ promocode: referralCode, user: receiver, status: true });

    let start_date = promocode.start_date ? promocode.start_date : new Date();
    let end_date = promocode.start_date ? promocode.end_date : new Date();

    if (
      (new Date().toString() >= start_date && end_date >= start_date) ||
      promocode.start_date === null ||
      promocode.end_date === null
    ) {
      if (
        getPromoCodeUsedCountByUser < promocode.maximum_usage_per_user &&
        getPromoCodeUsedCountByAllUsers < promocode.limit
      ) {
        let discountAmount =
          (parseFloat(promocode.discount) / parseFloat(100)) *
          parseFloat(price);

        if (promocode.allowed_maximum_discount !== null) {
          discountAmount =
            discountAmount <= promocode.allowed_maximum_discount
              ? discountAmount
              : promocode.allowed_maximum_discount;
        }

        let discountedPrice =
          parseFloat(price) - parseFloat(discountAmount.toFixed(2));

        return {
          discount: promocode.discount? promocode.discount.toFixed(2): 0,
          discountedPrice: discountedPrice ? discountedPrice.toFixed(2): 0,
          promocodeId: promocode.id,
          from: "promocode",
          discountYouGet: discountAmount? discountAmount.toFixed(2): 0,
          applied: true,
          CodeAapplied: referralCode,
        };
      } else {
        if (promocode.limit <= 0 || promocode.maximum_usage_per_user <= 0) {
          var msg = "Promocode limit or promocode user limit is set to 0";
        } else if (
          getPromoCodeUsedCountByUser >= promocode.maximum_usage_per_user
        ) {
          var msg = "Promocode user limit exceeded";
        } else if (
          getPromoCodeUsedCountByAllUsers >= promocode.maximum_usage_per_user
        ) {
          var msg = "Promocode maximum limit has reached, try again later";
        } else {
          var msg = "Promocode maximum limit exceeded, try again later";
        }
        return { applied: false, codeApplied: referralCode, msg: msg };
      }
    } else {
      return {
        applied: false,
        codeApplied: referralCode,
        msg: "Promocode expired",
      };
    }
  } else {
    var msg = "Invalid code";
    if (
      (affiliate !== null && affiliate.user.id === parseInt(receiver)) ||
      (userCode !== null && userCode.id === parseInt(receiver))
    ) {
      var msg = "Referrer and receiver can't be same";
    }
    return { applied: false, codeApplied: referralCode, msg: msg };
  }
}

module.exports = {
  //function will add voucher to bought list
  async BuyVoucher(user_id, voucher_id, code = null) {
    let voucher = await strapi
      .query("vouchers")
      .findOne({ id: voucher_id, status: true });
    let membership = await strapi.query("membership").count({ user: user_id });

    if (voucher != null && voucher.total_bought >= voucher.limit) {
      await strapi
        .query("vouchers")
        .update({ id: voucher.id }, { draw_status: "closed" });
      return { disabled: true, bought: "Limit is reached" };
    }

    if (voucher.enable_for_non_members === true && membership === 0) {
      var voucherCost = voucher.cost_for_non_members;
    } else {
      var voucherCost = voucher.cost;
    }

    let afterCodeApply = await ApplyCode(
      user_id,
      voucherCost,
      code,
      voucher_id
    );
    if (
      code !== null &&
      afterCodeApply !== null &&
      afterCodeApply.applied === false
    ) {
      return {
        codeStatus: afterCodeApply.msg,
        disabled: false,
        bought: "false",
      };
    }
    if (afterCodeApply.applied === true) {
      var cost = voucherCost;
      var paidAmount = afterCodeApply.discountedPrice;
    } else if (afterCodeApply.applied === false || code === null) {
      var cost = voucherCost;
      var paidAmount = voucherCost;
    }
    let dataToSave = {
      user: user_id,
      voucher: voucher.id,
      status: true,
      cost: cost,
      promocode_applied: afterCodeApply.applied === true ? code : null,
      paid_amount: paidAmount,
      discount: afterCodeApply.discount ? afterCodeApply.discount : null,
      is_won: false,
    };

    if (user_id !== null && voucher !== null) {
      let voucher_availed = await strapi
        .query("voucher-availed")
        .create(dataToSave);

      if (
        voucher_availed &&
        voucher.enable_for_non_members === true &&
        membership === 0
      ) {
        let membershipUpdate = await strapi.services.membership.generateMembership(
          user_id,
          voucher.membership_plans[0].id,
          voucher.membership_plans[0].duration
        );
        if (membershipUpdate) {
          await strapi
            .query("membership")
            .update(
              { id: membershipUpdate.id },
              { remarks: "generated via voucher for non members" }
            );
        }
      }
      if (afterCodeApply !== null && afterCodeApply.applied === true) {
        var codeStatus = "Success";
        if (afterCodeApply.from === "promocode") {
          var promocodeTransactions = {
            promocode: code,
            user: user_id,
            paid_amount: afterCodeApply.discountedPrice,
            discount: afterCodeApply.discount,
            applied_for: "voucher",
            cost: cost,
            inserted_id: voucher_availed.id,
            status: true,
          };
          let promoTransact = await strapi
            .query("promocode-transaction")
            .create(promocodeTransactions);
          if (
            promoTransact !== null &&
            afterCodeApply.from === "promocode" &&
            afterCodeApply.promocodeId !== null
          ) {
            let promocodeData = await strapi
              .query("promocode")
              .findOne({ id: afterCodeApply.promocodeId });
            let totalUsage = promocodeData.total_usage
              ? promocodeData.total_usage
              : 0;
            await strapi.query("promocode").update(
              { id: afterCodeApply.promocodeId },
              {
                total_usage: parseInt(totalUsage) + 1,
              }
            );
          }
        } else {
          let referralTransactions = {
            referral_code: code,
            user: user_id,
            paid_amount: afterCodeApply.discountedPrice,
            discount: afterCodeApply.discount,
            applied_for: "voucher",
            cost: cost,
            affiliate: afterCodeApply.affiliateId
              ? afterCodeApply.affiliateId
              : null,
            voucher_availed: voucher.id,
            from: afterCodeApply.from,
            referrer: afterCodeApply.userId ? afterCodeApply.userId : null,
            referrer_credit: afterCodeApply.referrerCredit
              ? afterCodeApply.referrerCredit
              : null,
            inserted_id: voucher_availed ? voucher_availed.id : null,
            status: true,
          };
          let referralTransact = await strapi
            .query("referral-code-transaction")
            .create(referralTransactions);
          //update the total usage count in affiliate
          if (
            referralTransact &&
            afterCodeApply.from === "affiliate" &&
            afterCodeApply.affiliateId !== null
          ) {
            let affiliateData = await strapi
              .query("affiliate")
              .findOne({ id: afterCodeApply.affiliateId });
            let totalUsage = affiliateData.total_usage
              ? affiliateData.total_usage
              : 0;
            await strapi.query("affiliate").update(
              { id: afterCodeApply.affiliateId },
              {
                total_usage: parseInt(totalUsage) + 1,
              }
            );
          } else if (referralTransact && afterCodeApply.from === "referral") {
            let userReferLogExist = await strapi
              .query("user-referral-log")
              .findOne({ user: afterCodeApply.userId });
            if (!userReferLogExist) {
              let count = 0;
              await strapi.query("user-referral-log").create({
                user: afterCodeApply.userId,
                count: count + 1,
              });
            } else {
              await strapi.query("user-referral-log").update(
                { user: afterCodeApply.userId },
                {
                  count: parseInt(userReferLogExist.count) + 1,
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

  async NotifyDrawDetails(ctx) {
    // let vou = process.env.applied_for_membership ? process.env.applied_for_membership: "applied for membership";
    // console.log(vou); return false;
    let params = ctx.request.body;

    let users = await strapi
      .query("user", "users-permissions")
      .find({ _limit: -1 });

    let expoTokens = [];
    await users.filter((user) => {
      if (user.notification_token !== null && user.notification_token !== "") {
        expoTokens.push(user.notification_token);
        return true;
      }
      return false;
    });

    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        mode: "no-cors",
        headers: {
          accept: "application/json",
          "accept-encoding": "gzip, deflate",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          to: "ExponentPushToken[fhwRxDCBR3vVli8XIDG8AJ]",
          title: "XZERO - Draw Winners are out!",
          body: "Checkout whether you are in the list. ",
          sound: "default",
          priority: "high",
        }),
      });
    } catch (e) {
      console.log("Notification Push", e);
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
      .find({ status: true, voucher: voucher.id, _limit: -1 });
    if (
      voucherAvailedArray !== null &&
      postData.draw_status === "declare" &&
      voucher.length !== 0
    ) {
      let voucherAvailedIds = [].concat(
        ...voucherAvailedArray.map((voucher_availed) => voucher_availed.id)
      );

      let Totalwinners = [];
      let wonUsers = [];
      var giftAchievers = [];
      let history = [];
      let winnersName = [];

      await Promise.all(
        voucher.draw_gift.map(async (gift) => {
          if (gift.quantity > 0 && gift.status === true) {
            let winnersGot = _.sampleSize(voucherAvailedIds, gift.quantity);
            giftAchievers.push({
              gift: gift.title_en,
              winnersVocherAvailedId: winnersGot,
              winnersCount: winnersGot.length,
            });
            for (let i = 0; i < winnersGot.length; i++) {
              var voucherIdIndex = voucherAvailedIds.indexOf(winnersGot[i]);
              voucherAvailedIds.splice(voucherIdIndex, 1);
              let voucherAvailed = await strapi
                .query("voucher-availed")
                .update(
                  { id: winnersGot[i] },
                  { is_won: true, draw_gift_won: gift.id }
                );
              await strapi
                .query("vouchers")
                .update({ id: voucher.id }, { draw_status: "closed" });
              Totalwinners.push(winnersGot[i]);
              wonUsers.push(voucherAvailed.user.id);
              winnersName.push(voucherAvailed.user.username);
            }
            history = {
              winners: wonUsers.join(),
              winnersName: winnersName.join(),
              winnerDetails: giftAchievers,
              totalWinners: Totalwinners.length,
              voucher: voucher.id,
              voucherTitle: voucher.buy_title_en,
            };
          }
        })
      );

      if (history.length > 0) {
        await strapi.query("draw-history").create({ draw_details: history });
      }

      ctx.send({ winners: history });
    } else if (postData.draw_status === "publish") {
      let winners = await strapi
        .query("voucher-availed")
        .find({ is_won: true });
      if (winners) {
        await Promise.all(
          winners.map(async (winner) => {
            //   try {
            //     await fetch('https://exp.host/--/api/v2/push/send', {
            //      method: 'POST',
            //      mode: 'no-cors',
            //      headers: {
            //        'accept': 'application/json',
            //        'accept-encoding': 'gzip, deflate',
            //        'content-type': 'application/json',
            //      },
            //      body: JSON.stringify({
            //        to: winner.user.notification_token,
            //        title: "XZERO - Draw Winners are out!",
            //        body: "Checkout whether you are in the list. Good luck",
            //        sound: 'default',
            //        priority: 'high'
            //      })
            //    });
            //  }
            //  catch (e) {
            //    console.log('Notification Push', e);
            //  }
            //sendMail(winner.user.id);
          })
        );

        ctx.send("published winner, email is sent");
      }
    } else if (voucher.length == 0) {
      return ctx.badRequest(
        null,
        formatError({
          id: "voucher.availed.status",
          message: "Voucher status is not in progress",
        })
      );
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "voucher.availed.status",
          message: "Something gone wrong",
        })
      );
    }
  },


  KonozWinners: async (ctx) => {
    let postData = ctx.request.body;
    //console.log(postData); return false;
    let giftWon = [
      {
        "title": "Iphone 12 pro max",
        "featured_imgs": [
          "https://be.xzero.app/v2/uploads/i_Phone_12_Pro_f1dd993eee.png",
          "https://be.xzero.app/v2/uploads/i_Phone_12_Mini_a1211842ac.png",
          "https://be.xzero.app/v2/uploads/Apple_Watch_Series_6_7c130146e0.png"
        ],
        "winnersName": [
          "naufall",
          "naufall"
        ]
      },
      {
        "title": "ipad",
        "featured_imgs": [
          "https://be.xzero.app/v2/uploads/i_Phone_12_Pro_f1dd993eee.png",
          "https://be.xzero.app/v2/uploads/i_Phone_12_Mini_a1211842ac.png"],
        "winnersName": [
          "ajith",
          null,
          null
        ]
      },
      {
        "title": "apple watch",
        "featured_imgs": [],
        "winnersName": [
          "naufall",
        ],

        "featured_imgs": [
          "https://be.xzero.app/v2/uploads/i_Phone_12_Pro_f1dd993eee.png",
          "https://be.xzero.app/v2/uploads/i_Phone_12_Mini_a1211842ac.png"],
      }
    ];
     
    
    ctx.send( giftWon );

  },

  //function randomly select a user and would declare as a winner
  DeclareKonozWinners: async (ctx) => {
    let postData = ctx.request.body;

    let voucher = await strapi
      .query("vouchers")
      .findOne({ status: true, id: postData.id });

    let voucherAvailedArray = await strapi
      .query("voucher-availed")
      .find({ status: true, voucher: voucher.id, _limit: -1 });
    if (
      voucherAvailedArray !== null && voucher.length !== 0
    ) {
      let voucherAvailedIds = [].concat(
        ...voucherAvailedArray.map((voucher_availed) => voucher_availed.id)
      );

      var giftAchievers = [];
      let history = [];

      let giftWon = [];

      await Promise.all(
        voucher.draw_gift.map(async (gift) => {
          
          let Totalwinners = [];
          let winnersName = [];
          let wonUsers = [];
          if (gift.quantity > 0 && gift.status === true) {
            let winnersGot = _.sampleSize(voucherAvailedIds, gift.quantity);

            giftAchievers.push({
              gift: gift.title_en,
              winnersVocherAvailedId: winnersGot,
              winnersCount: winnersGot.length,
            });
            for (let i = 0; i < winnersGot.length; i++) {
              var voucherIdIndex = voucherAvailedIds.indexOf(winnersGot[i]);
              voucherAvailedIds.splice(voucherIdIndex, 1);

              let voucherAvailed = await strapi
                .query("voucher-availed")
                .update(
                  { id: winnersGot[i] },
                  { is_won: true, draw_gift_won: gift.id }
                );
              await strapi
                .query("vouchers")
                .update({ id: voucher.id }, { draw_status: "closed" });

              Totalwinners.push(winnersGot[i]);

              wonUsers.push(voucherAvailed.user.id);

              winnersName.push(voucherAvailed.user.username);


            }
            let featuredImgs =  gift.featured_imgs.map((imgs) => imgs.url )
 
            
            giftWon.push({title: gift.title_en, featured_imgs: featuredImgs, winnersName})
            
            history = { giftWon };
          }
        })
      );

      if (history.length > 0) {
        await strapi.query("draw-history").create({ draw_details: history });
      }

      
      giftWon = [
        {
          "title": "Iphone 12 pro max",
          "featured_imgs": [
            "https://be.xzero.app/v2/uploads/i_Phone_12_Pro_f1dd993eee.png",
            "https://be.xzero.app/v2/uploads/i_Phone_12_Mini_a1211842ac.png",
            "https://be.xzero.app/v2/uploads/Apple_Watch_Series_6_7c130146e0.png"
          ],
          "winnersName": [
            "naufall",
            "naufall"
          ]
        },
        {
          "title": "ipad",
          "featured_imgs": [
            "https://be.xzero.app/v2/uploads/i_Phone_12_Pro_f1dd993eee.png",
            "https://be.xzero.app/v2/uploads/i_Phone_12_Mini_a1211842ac.png"],
          "winnersName": [
            "ajith",
            null,
            null
          ]
        },
        {
          "title": "apple watch",
          "featured_imgs": [],
          "winnersName": [
            "naufall",
          ],
  
          "featured_imgs": [
            "https://be.xzero.app/v2/uploads/i_Phone_12_Pro_f1dd993eee.png",
            "https://be.xzero.app/v2/uploads/i_Phone_12_Mini_a1211842ac.png"],
        }
      ];

      ctx.send( giftWon );
    } else if (postData.draw_status === "publish") {
      let winners = await strapi
        .query("voucher-availed")
        .find({ is_won: true });
      if (winners) {
        await Promise.all(
          winners.map(async (winner) => {
            //   try {
            //     await fetch('https://exp.host/--/api/v2/push/send', {
            //      method: 'POST',
            //      mode: 'no-cors',
            //      headers: {
            //        'accept': 'application/json',
            //        'accept-encoding': 'gzip, deflate',
            //        'content-type': 'application/json',
            //      },
            //      body: JSON.stringify({
            //        to: winner.user.notification_token,
            //        title: "XZERO - Draw Winners are out!",
            //        body: "Checkout whether you are in the list. Good luck",
            //        sound: 'default',
            //        priority: 'high'
            //      })
            //    });
            //  }
            //  catch (e) {
            //    console.log('Notification Push', e);
            //  }
            //sendMail(winner.user.id);
          })
        );

        ctx.send("published winner, email is sent");
      }
    } else if (voucher.length == 0) {
      return ctx.badRequest(
        null,
        formatError({
          id: "voucher.availed.status",
          message: "Voucher status is not in progress",
        })
      );
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "voucher.availed.status",
          message: "Something gone wrong",
        })
      );
    }
  },
};
