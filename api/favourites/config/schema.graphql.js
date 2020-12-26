
module.exports = {
    mutation: 
    `AddAsFavourite(user: Int!, offer: Int!, center: Int!): JSON!
     ClearAllFavourites(user:Int): Boolean
    `,
    resolver: {
        Mutation: {
            AddAsFavourite: {
              description: 'adding the favourite offers',
              //policies: ['plugins::users-permissions.isAuthenticated'],
              resolverOf: 'application::favourites.favourites.create',
              resolver: async (obj, options, ctx) => {
                  return await strapi.api['favourites'].controllers['favourites'].AddAsFavourite(options.user, options.offer, options.center);
              }
            },

            ClearAllFavourites: {
              description: 'adding the favourite offers',
              //policies: ['plugins::users-permissions.isAuthenticated'],
              resolverOf: 'application::favourites.favourites.update',
              resolver: async (obj, options, ctx) => {
                  return await strapi.api['favourites'].controllers['favourites'].ClearAllFavourites(options.user);
              }
          }
        },

        

    }
}