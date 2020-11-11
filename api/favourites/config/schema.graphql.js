
module.exports = {
    mutation: 'AddFavourites(user: Int!, offer: Int!, plan: Int):Favourites!',
    resolver: {
        Mutation: {
            AddFavourites: {
                description: 'adding the favourite offers',
                policies: ['plugins::users-permissions.isAuthenticated'],
                resolverOf: 'application::favourites.favourites.create',
                resolver: async (obj, options, ctx) => {
                    return await strapi.api['favourites'].controllers['favourites'].AddFavourites(options.user, options.offer, options.plan);
                }
            }
        }
    }
}