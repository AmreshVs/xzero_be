"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async categoriesWithCenterCount(options) {
    // Reusing the same for both Categories on Homepage and for specialist page
    let categories = await strapi
      .query("categories")
      .find({ enabled: 1, _limit: -1 });

    let categoriesWithCenters = await Promise.all(
      categories.map(async ({ id, title_en, title_ar, featured_img }) => {
        let centersCount = await strapi
          .query(options.specialist ? "specialist" : "centers")
          .count({ category: id });

        return Promise.resolve({
          id,
          title_en,
          title_ar,
          featured_img: featured_img.url,
          centersCount: (await centersCount) || 0,
        });
      })
    );

    if (options.specialist) {
      return categoriesWithCenters;
    }

    let specialistCount = await strapi.query("specialist").count();
    let specialistData = await strapi
      .query("specialist-help")
      .find({ _limit: -1 });
    let specialistHelp = [
      {
        type: "specialist",
        title_en: specialistData[0].title_en,
        title_ar: specialistData[0].title_ar,
        featured_img: specialistData[0].featured_img.url,
        centersCount: specialistCount,
      },
    ];

    return categoriesWithCenters.concat(specialistHelp);
  },
};
