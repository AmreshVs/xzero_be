
module.exports = {
    mutation: 
    `SaveForLater(user: Int!, article: Int!): JSON!
    `,

    resolver: {
        Mutation: {
            SaveForLater: {
              description: 'add the news to saved list',
              resolverOf: 'application::saved-articles.saved-articles.create',
              resolver: async (obj, options, ctx) => {
                  return await strapi.api['saved-articles'].controllers['saved-articles'].SaveForLater(options.user, options.article);
              }
            },
        },
    }
}