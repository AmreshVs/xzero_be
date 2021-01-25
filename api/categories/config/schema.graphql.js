module.exports = {
  query: `categoriesWithCenterCount(specialist: Boolean): JSON!`,
  resolver: {
    Query: {
      categoriesWithCenterCount: {
        description: "Return the Categories with centerCounts",
        resolverOf: "application::categories.categories.find",
        resolver: async (obj, options, ctx) => {
          return await strapi.api.categories.controllers.categories.categoriesWithCenterCount(
            options || {}
          );
        },
      },
    },
  },
};
