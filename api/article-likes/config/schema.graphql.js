module.exports = {
  mutation: 
  `Like(user: Int!, article: Int!): JSON!`,
  resolver: {
      Mutation: {
        Like: {
            description: 'saves the liked article record',
            resolverOf: 'application::article-likes.article-likes.create',
            resolver: async (obj, options, ctx) => {
                return await strapi.api['article-likes'].controllers['article-likes'].Like(options.user, options.article);
            }
          },
      },
  }
}