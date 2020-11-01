module.exports = {
  mutation: `
    generateMembership(user_id: ID!, amount: Int!): Membership!
  `,
  resolver: {
    Mutation: {
      generateMembership: {
        description: 'Generate Membership for user',
        policies: ['plugins::users-permissions.isAuthenticated'],
        resolverOf: 'application::membership.membership.create',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.membership.controllers.membership.generateMembership(options.user_id, options.amount);
        },
      },
    }
  },

  // mutation: `
  // CheckSerialExist(user_id: ID!): Membership!
  // `,
  // resolver: {
  //   Mutation: {
  //     generateMembership: {
  //       description: 'Check user details',
  //       policies: ['plugins::users-permissions.isAuthenticated'],
  //       resolverOf: 'application::membership.membership.find',
  //       resolver: async (obj, options, ctx) => {
  //         return await strapi.api.membership.controllers.membership.CheckSerialExist(options.user_id);
  //       },
  //     },
  //   }
  // }
}
