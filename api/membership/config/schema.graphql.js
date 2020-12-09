const _ = require('lodash');
/**
 * Throws an ApolloError if context body contains a bad request
 * @param contextBody - body of the context object given to the resolver
 * @throws ApolloError if the body is a bad request
 */
function checkBadRequest(contextBody) {
  if (_.get(contextBody, 'statusCode', 200) !== 200) {
    const message = _.get(contextBody, 'error', 'Bad Request');
    const exception = new Error(message);
    exception.code = _.get(contextBody, 'statusCode', 400);
    exception.data = contextBody;
    throw exception;
  }
}

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
        resolver: async (obj, options, {context}) => {
          //return await strapi.api.membership.controllers.membership.generateMembership(options.user_id, options.plan, options.code);

          context.request.body = _.toPlainObject(options);
          await strapi.api.membership.controllers.membership.generateMembership(context);
          
          let output = context.body.toJSON ? context.body.toJSON() : context.body;
          checkBadRequest(output);
          return { 
            membership: output.membership || output,
            codeStatus: output.codeStatus
          }

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
