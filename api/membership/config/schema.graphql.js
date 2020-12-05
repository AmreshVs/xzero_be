module.exports = {

  definition: ` 
        type membership {
            membership : Membership,
            expiry : Int,
            codeStatus: JSON
        } 
       
				`
				, 

  mutation: `
    generateMembership(user_id: ID!, plan :Int!, promocode: String): membership!
  `,
  resolver: {
    Mutation: {
      generateMembership: {
        description: 'Generate Membership for user',
        policies: ['plugins::users-permissions.isAuthenticated'],
        resolverOf: 'application::membership.membership.create',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.membership.controllers.membership.generateMembership(options.user_id, options.plan, options.promocode);
        },
      },
    }
  },

  
}
