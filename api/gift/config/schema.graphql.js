
module.exports = {
    mutation: `SelectRandomUsersForGift: JSON!,  GiftAvail: JSON!`,
    query: 'GetGiftAdded(where: JSON): [Gift]',
    resolver: {
    Mutation: {
        SelectRandomUsersForGift: {
        description: 'Select users for gift',
        policies: [],
        resolverOf: 'application::gift.gift.find',
        resolver: async (obj, options, ctx) => {
        return await strapi.api.gift.controllers.gift.SelectRandomUsersForGift();
        }
    }
    },

    Query: {
        GetGiftAdded: {
          description: 'Return the gifts',
          resolverOf: 'application::gift.gift.find',
          resolver: async (obj, options, ctx) => {
            return await strapi.api.gift.controllers.gift.GetGiftAdded(options.where || {});
          },
        },
      },
    }
}