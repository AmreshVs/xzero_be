module.exports = {

  definition: ` 
        type membership {
            membership : Membership,
            codeStatus: JSON
        } 

				`
				, 

  mutation: `
    generateMembership(user_id: ID!, plan :Int!, code: String): membership!
  `,

  query: 'getMembershipExpiryDays(user_id:ID!): JSON',

  resolver: {
    Mutation: {
      generateMembership: {
        description: 'Generate Membership for user',
        policies: ['plugins::users-permissions.isAuthenticated'],
        resolverOf: 'application::membership.membership.create',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.membership.controllers.membership.generateMembership(options.user_id, options.plan, options.code);
        },
      },
    },

    Query: {
      getMembershipExpiryDays: {
        description: 'Get membership expiry in days',
        policies: ['plugins::users-permissions.isAuthenticated'],
        resolverOf: 'application::membership.membership.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.membership.controllers.membership.getMembershipExpiryDays(options.user_id);
        },
      },
    }

  },

  
}
