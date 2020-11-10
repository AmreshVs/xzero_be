"use strict";
var fs = require("fs");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

async function generateTransactionId() {
  let trid = Math.random().toString(10).substr(2, 8);
  let TRNExist = await strapi
    .query("center-check-in")
    .findOne({ transaction_id: trid });
  if (TRNExist === null) {
    return trid.toUpperCase();
  } else {
    await generateTRId();
  }
}

module.exports = {
  //insert check-in data and update limit in membership table
  async Checkin(user_id, center_id, offers) {
    let membership = await strapi.query("membership").findOne({ user: 132 });
    if (membership === null || new Date() > new Date(membership.expiry)) {
      console.log("User not exist or membership expired!");
      return false;
    }
    let msg;
    if (user_id !== null && center_id !== null) {
      let centeradd;
      let limit = 0;
      let iteratecount = 0;
      let offerArray = offers.split(",");
      let trid = await generateTransactionId();
      if (offerArray.length <= membership.limit) {
        for (let index = 0; index < offerArray.length; index++) {
          //getting the original price, discounted price, and offer per
          let offersavailable = await strapi
            .query("offers")
            .findOne({ id: offerArray[index] });
          centeradd = await strapi
            .query("center-check-in")
            .create({
              user_id: user_id,
              center: center,
              offer_id: offerArray[index],
              transaction_id: trid,
              discounted_price: offersavailable.discounted_price,
              original_price: offersavailable.actual_price,
              offer: offersavailable.discount,
            });
          iteratecount = index + 1;
        }
        let limitBecom = parseInt(membership.limit - iteratecount);
        if (limitBecom >= 0) {
          return centeradd;
        }
        return centeradd;
      } else {
        if (membership.limit > 0) {
          limit = membership.limit;
        }
        console.log(
          `You have chosen offers which exceeds the limit. Your limit is ${limit}, To add more please renew the membership or`
        );
      }
    } else {
      console.log("empty params");
    }
  },

  //returning the offers availed and the membership info
  async getMembershipInfo(user_id, condition) {
    let offers = await strapi
      .query("offers")
      .find({ center: condition.center });
    let memberships = await strapi
      .query("membership")
      .findOne({ user: user_id });
    return { offer: offers, membership: memberships };
  },

  //Returning the center check in details for a user
  async getuserCheckinDetails(user_id, condition) {
    let centers = await strapi
      .query("center-check-in")
      .find({ user_id: user_id, center_id: condition.center });
    return { center: centers };
  },

  //Return the center check in by transaction id
  async CenterCheckinByTransactionId(user_id, transaction_id) {
    let centercheckins = await strapi
      .query("center-check-in")
      .find({ transaction_id: transaction_id });
    return { centercheckin: centercheckins };
  },

  //Return the recent users
  async RecentUsers(center_id) {
    let recentusers = await strapi
      .query("center-check-in")
      .find({ center: center_id, _limit: 10, _sort: "id:desc" });
    return recentusers;
  },

  //Return the offers for a particular center
  async getOffers(center_id) {
    let offersbycenter = await strapi
      .query("offers")
      .find({ center: center_id });
    return offersbycenter;
  },

  //Return the usercheckins for a specific center
  async UserCheckins(center_id) {
    let usercheckinsAvailed = await strapi
      .query("center-check-in")
      .find({ center: center_id });
    return usercheckinsAvailed;
  },

  //Return the center home data including the counts, center offers and the recent users
  async getCenterHomeData(center_id) {
    let CenterOffers = await strapi.query("offers").find({ center: center_id });
    let centers = await strapi.query("centers").findOne({ id: center_id });
    let RecentUsers = await strapi
      .query("center-check-in")
      .find({ center: center_id, _limit: 10, _sort: "id:desc" });
    //queries to get the count
    let offersCount = await strapi.query("offers").count({ center: center_id });
    let visitsCount = await strapi.query("center-check-in").count({ center: center_id });
    let counts = { offers: offersCount, visits: visitsCount, favourites: 123 };
    return {
      counts: counts,
      offers: CenterOffers,
      recentUsers: RecentUsers,
      center: centers
    };
  },
};
