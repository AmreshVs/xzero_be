module.exports = {
  mutation: `
    addFavourite(user_id: Int!, offer_id: Int!): JSON!,
    updateLocation: JSON
  `,
  query: `
    offerListWithFavourites(where: JSON, user_id: Int): JSON!,
    offerIsFavourite(id: Int, user_id: Int): Boolean!,
    favouritesByUser(user_id: Int!): [Offers]
  `,
  resolver: {
    Query: {
      offerListWithFavourites: {
        description: 'Return the Offers list with favourites',
        resolverOf: 'application::offers.offers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.offers.controllers.offers.offerListWithFavourites(options.where || {}, options.user_id);
        },
      },
      offerIsFavourite: {
        description: 'Return the If the offer is favourite or not',
        resolverOf: 'application::offers.offers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.offers.controllers.offers.offerIsFavourite(options.id, options.user_id);
        },
      },
      favouritesByUser: {
        description: 'Return the Favourite Offers based on the user',
        resolverOf: 'application::offers.offers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.offers.controllers.offers.favouritesByUser(options.user_id);
        },
      }
    },
    Mutation: {
      addFavourite: {
        description: 'Add Favourite Offer',
        resolverOf: 'application::offers.offers.create',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.offers.controllers.offers.addFavourite(options.user_id, options.offer_id);
        },
      },
      
      updateLocation: {
        description: 'Update google map location',
        resolverOf: 'application::offers.offers.update',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.offers.controllers.offers.updateLocation();
        },
      }
    }
  },
};
