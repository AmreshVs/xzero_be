"use strict";
var fs = require("fs");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

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

module.exports = {
  //insert check-in data and update limit in membership table
  async Checkin(user_id, center_id, offers) {
    let memberShip = await strapi
      .query("membership")
      .findOne({ user: user_id });
    if (memberShip === null || new Date() > new Date(memberShip.expiry)) {
      console.log("User not exist or membership expired!");
      return false;
    }
    if (user_id !== null && center_id !== null) {
      let centerAdd;
      let limit = 0;
      let iterateCount = 0;
      let offerArray = offers.split(",");
      let trId = await generateTransactionId();
      if (offerArray.length <= memberShip.limit) {
        for (let index = 0; index < offerArray.length; index++) {
          //getting the original price, discounted price, and offer per
          let offersAvailable = await strapi
            .query("offers")
            .findOne({ id: offerArray[index] });
          centerAdd = await strapi.query("center-check-in").create({
            user_id: user_id,
            center: center_id,
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
            { user: user_id },
            {
              limit: limitBecom,
            }
          );
          return centerAdd;
        }
        return centerAdd;
      } else {
        if (memberShip.limit > 0) {
          limit = memberShip.limit;
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
  async getMembershipInfo(serial, condition) {
    let offers = await strapi
      .query("offers")
      .find({ center: condition.center });
    let memberShips = await strapi
      .query("membership")
      .findOne({ serial: serial });
    return { offer: offers, membership: memberShips };
  },

  //Returning the center check in details for a user
  async getuserCheckinDetails(user_id, condition) {
    let centers = await strapi
      .query("center-check-in")
      .find({ user_id: user_id, center_id: condition.center });
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
      .find({ center: center_id, _sort: "id:desc" });
    return offersByCenter;
  },

  //Return the usercheckins for a specific center
  async UserCheckins(center_id) {
    let userCheckinsAvailed = await strapi
      .query("center-check-in")
      .find({ center: center_id });
    return userCheckinsAvailed;
  },

  //Return the center home data including the counts, center offers and the recent users
  async getCenterHomeData(center_id) {
    let recentUsers = [];
    let offers = [];
    let centerOffers = await strapi
      .query("center-check-in")
      .find({ center: center_id, _limit: 5, _sort: "id:desc" });

    if (centerOffers === null) {
      offers = await strapi
        .query("offers")
        .find({ center: center_id, _limit: 5, _sort: "id:desc" });
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
      .count({ center: center_id });

      const result = await strapi
        .query('center-check-in')
        .model.query(qb => {
          qb.where('center', center_id), qb.distinct('user_id');
        })
        .fetchAll();

      const fields = result.toJSON();

      let visitsCount = fields.length;
      
    let favouritesCount = await strapi
      .query("favourites")
      .count({ center: center_id });
    let counts = {
      offers: offersCount,
      visits: visitsCount,
      favourites: favouritesCount,
    };

    return {
      counts: counts,
      offers: [
        ...new Map(offers.map((item) => [item["id"], item])).values(),
      ].slice(0, 4),
      recentUsers: recentUsers,
      center: center,
    };
  },
};
