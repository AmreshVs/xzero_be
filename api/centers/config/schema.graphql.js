module.exports = {
  query: `topCenters(where: JSON): JSON!`,
  resolver: {
    Query: {
      topCenters: {
        description: 'Return the count for Home',
        resolverOf: 'application::centers.centers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.centers.controllers.centers.top_centers(options.where || {});
        },
      },
    },
  },
};
