
module.exports = {
  definition: `
    type UserGifts {
      gifts: [Gifts],
      AvailedGifts: [GiftAvailed]
    }

    type GiftsPayLoad {
      disabled: Boolean,
      won: Boolean!,
      gift: Gifts
    }
  `,
  mutation: `GenerateGift(user_id: Int!): GiftsPayLoad!`,
  query: 'AvailableGifts(where: JSON): UserGifts!',
  
  resolver: {
    Mutation: {
      GenerateGift: {
        description: 'Select users for gift',
        policies: [],
        resolverOf: 'application::gifts.gifts.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.gifts.controllers.gifts.GenerateGift(options.user_id);
        }
      }
    },

    Query: {
      AvailableGifts: {
        description: 'Return the gifts',
        resolverOf: 'application::gifts.gifts.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.gifts.controllers.gifts.AvailableGifts(options.where || {});
        },
      },
    },
  }
}