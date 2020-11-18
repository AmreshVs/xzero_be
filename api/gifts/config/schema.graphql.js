
module.exports = {

    definition: 'type UserGifts { gifts: [Gifts], giftavailed: [GiftAvailed] }',

    mutation: `SelectRandomUsersForGift(user_id: Int!): JSON!,  GiftAvail: JSON!`,
    query: 'GetGiftAdded(where: JSON): UserGifts!',
    resolver: {
    Mutation: {
        SelectRandomUsersForGift: {
        description: 'Select users for gift',
        policies: [],
        resolverOf: 'application::gifts.gifts.find',
        resolver: async (obj, options, ctx) => {
        return await strapi.api.gifts.controllers.gifts.SelectRandomUsersForGift(options.user_id||'');
        }
    }
    },

    Query: {
        GetGiftAdded: {
          description: 'Return the gifts',
          resolverOf: 'application::gifts.gifts.find',
          resolver: async (obj, options, ctx) => {
            return await strapi.api.gifts.controllers.gifts.GetGiftAdded(options.where || {});
          },
        },
      },
    }
}