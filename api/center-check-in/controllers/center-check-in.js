"use strict";
var fs = require("fs");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const fetch = require("node-fetch");
async function generateTransactionId() {
  let trId = Math.random().toString(10).substr(2, 8);
  let trnExist = await strapi
    .query("center-check-in")
    .findOne({ transaction_id: trId });
  if (trnExist === null) {
    return trId;
  } else {
    await generateTransactionId();
  }
}

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  //insert check-in data and update limit in membership table
  async Checkin(ctx) {
    const params = ctx.request.body;
    let memberShip = await strapi
      .query("membership")
      .findOne({ user: params.user_id });
    if (memberShip === null || new Date() > new Date(memberShip.expiry)) {
      return ctx.badRequest(
        null,
        formatError({
          id: "center-checkin.membership.expired",
          message: "User not exist or membership expired!.",
        })
      );
    }

    if (params.user_id !== null && params.center_id !== null) {
      let centerAdd;
      let limit = 0;
      let iterateCount = 0;
      let offerArray = params.offers.split(",");
      let trId = await generateTransactionId();
      let offerNames = [];
      let centerName = "xzero";
      if (offerArray.length <= memberShip.limit) {
        for (let index = 0; index < offerArray.length; index++) {
          //getting the original price, discounted price, and offer per
          let offersAvailable = await strapi
            .query("offers")
            .findOne({ id: offerArray[index] });

          offerNames.push(offersAvailable.title_en);
          centerName = offersAvailable.center.title_en;
          centerAdd = await strapi.query("center-check-in").create({
            user_id: params.user_id,
            center: params.center_id,
            offer_id: offerArray[index],
            transaction_id: trId,
            discounted_price: offersAvailable.discounted_price,
            original_price: offersAvailable.actual_price,
            discount: offersAvailable.discount,
          });
          iterateCount = index + 1;
        }
        let limitBecom = parseInt(memberShip.limit) - parseInt(iterateCount);
        if (limitBecom >= 0) {
          await strapi.query("membership").update(
            { user: params.user_id },
            {
              limit: limitBecom,
            }
          );
        }

        let titleNoti = "Thank you for visiting " + centerName;
        let bodyMsg =
          "You have opted for " + offerNames.join(", ") + " at " + centerName;

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
              to: memberShip.user.notification_token,
              title: titleNoti,
              body: bodyMsg,
              sound: "default",
              priority: "high",
            }),
          });
        } catch (e) {
          console.log("Checkin Notification Push", e);
        }
        return ctx.send(centerAdd);
      } else {
        if (memberShip.limit > 0) {
          limit = memberShip.limit;
        }

        return ctx.badRequest(
          null,
          formatError({
            id: "center-checkin.offerlimit.exceeded",
            message:
              "You have chosen offers which exceeds the limit. Your limit is " +
              limit +
              ", To add more please renew the membership.",
          })
        );
      }
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "center-checkin.offerlimit.emptyparams",
          message: "empty params.",
        })
      );
    }
  },

  //returning the offers availed and the membership info
  async getMembershipInfo(serial, condition) {
    let offers = await strapi
      .query("offers")
      .find({ center: condition.center, status: true, _limit: -1 });
    let memberShips = await strapi
      .query("membership")
      .findOne({ serial: serial });
    return { offer: offers, membership: memberShips };
  },

  //Returning the center check in details for a user
  async getuserCheckinDetails(user_id, condition) {
    let centers = await strapi
      .query("center-check-in")
      .find({ user_id: user_id, center_id: condition.center, _limit: -1 });
    return { center: centers };
  },

  //Return the center check in by transaction id
  async CenterCheckinByTransactionId(transaction_id) {
    let offers = [];
    let centerCheckIns = await strapi
      .query("center-check-in")
      .find({ transaction_id: transaction_id });
    let userInfo = centerCheckIns[0].user_id;

    await centerCheckIns.map((center) => {
      offers.push({
        ...center.offer_id,
        discounted_price: center.discounted_price,
        original_price: center.original_price,
        discount: center.discount,
      });
    });
    return { userInfo, offers };
  },

  //Return the recent users
  async RecentUsers(center_id) {
    let recentUsers = await strapi
      .query("center-check-in")
      .find({ center: center_id, _limit: 10, _sort: "id:desc" });
    return recentUsers;
  },

  //Return the offers for a particular center
  async getOffers(center_id) {
    let offersByCenter = await strapi
      .query("offers")
      .find({ status: true, center: center_id, _sort: "id:desc", _limit: -1 });
    return offersByCenter;
  },

  //Return the usercheckins for a specific center
  async UserCheckins(center_id) {
    let userCheckinsAvailed = await strapi
      .query("center-check-in")
      .find({ center: center_id, _limit: -1, _sort: "id:desc" });
    return userCheckinsAvailed;
  },

  //Return the center home data including the counts, center offers and the recent users
  async getCenterHomeData(center_id) {
    let recentUsers = [];
    let offers = [];
    let centerOffers = await strapi
      .query("center-check-in")
      .find({ center: center_id, _limit: 5, _sort: "id:desc" });
    if (centerOffers === null || centerOffers.length === 0) {
      offers = await strapi
        .query("offers")
        .find({ status: true, center: center_id, _limit: 5, _sort: "id:desc" });
    } else {
      centerOffers.map((center) => {
        if (center.offer_id !== null) {
          offers.push(center.offer_id);
        }
        recentUsers.push({
          ...center.user_id,
          transaction_id: center.transaction_id,
          checked_in: center.created_at,
        });
        return null;
      });
    }
    let center = await strapi.query("centers").findOne({ id: center_id });
    //queries to get the count
    let offersCount = await strapi
      .query("offers")
      .count({ center: center_id, status: true });
    const result = await strapi
      .query("center-check-in")
      .model.query((qb) => {
        qb.where("center", center_id), qb.distinct("user_id");
      })
      .fetchAll();
    const fields = result.toJSON();
    let visitsCount = fields.length;
    let favouritesCount = await strapi
      .query("favourites")
      .count({ center: center_id, status: true });
    let counts = {
      offers: offersCount,
      visits: visitsCount,
      favourites: favouritesCount,
    };
    return {
      counts: counts,
      offers: [
        ...new Map(offers.map((item) => [item["center"], item])).values(),
      ].slice(0, 4),
      recentUsers: recentUsers,
      center: center,
    };
  },
};
