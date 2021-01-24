"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require("lodash");

module.exports = {
  async top_centers(condition) {
    let centers = await strapi.query("centers").find(condition);
    let offersByCenter = await Promise.all(
      centers.map(
        async ({ id, title_en, title_ar, place, city, featured_img }) => {
          let offersCount = await strapi.query("offers").count({ center: id });
          let discount = await strapi
            .query("offers")
            .find({ center: id, _limit: 1, _sort: "discount:desc" });
          return Promise.resolve({
            id,
            title_en,
            title_ar,
            place,
            city,
            featured_img: featured_img.url,
            offersCount: (await offersCount) || 0,
            discount:
              (await discount[0]) !== undefined ? discount[0].discount : 0,
          });
        }
      )
    );
    return _.orderBy(offersByCenter, ["discount"], ["desc"]);
  },
};
