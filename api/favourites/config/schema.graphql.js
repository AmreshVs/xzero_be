const _ = require("lodash");
module.exports = {
    mutation: 
    `AddAsFavourite(user: Int!, offer: Int!, center: Int): JSON!
     ClearAllFavourites(user:Int): Boolean
    `,

    query: 
    `HomeBannerCounts (user: Int!):JSON`,

    resolver: {
        Mutation: {
            AddAsFavourite: {
              description: 'adding the favourite offers',
              resolverOf: 'application::favourites.favourites.create',
              resolver: async (obj, options, ctx) => {
                  return await strapi.api['favourites'].controllers['favourites'].AddAsFavourite(options.user, options.offer, options.center);
              }
            },

            ClearAllFavourites: {
              description: 'adding the favourite offers',
              resolverOf: 'application::favourites.favourites.update',
              resolver: async (obj, options, ctx) => {
                  return await strapi.api['favourites'].controllers['favourites'].ClearAllFavourites(options.user);
              }
          }
        },

        Query: {
          HomeBannerCounts: {
            description: 'finding the count of favourites',
            resolverOf: 'application::favourites.favourites.find',
            resolver: async (obj, options, { context }) => {
              context.request.body = _.toPlainObject(options);
              await strapi.api["favourites"].controllers[
                "favourites"
              ].HomeBannerCounts(context);
              let output = context.body.toJSON
                ? context.body.toJSON()
                : context.body;
              return output;
            },
          },
        }
    }
}