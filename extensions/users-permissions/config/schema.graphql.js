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
    type CreateUserPayload {
      jwt: String
      user: UsersPermissionsUser!
    }
  `,
  mutation: `
    createNewUser(username: String!, email: String!, password: String!, mobile_number: Long!, notification_token: String!, dob: String, birthday: DateTime, otp: String): CreateUserPayload!
    userlogin(input: UsersPermissionsLoginInput!): CreateUserPayload!,
    UpdateUserReferralCode: JSON
    generateOtp(user: ID!): UsersPermissionsUser
  `,

  query : `verifyOtp(user: ID!, otp: Int): JSON`, 

  resolver: {
    Query: {
      verifyOtp: {
        description: "function will verift otp return the message",
        resolverOf: 'plugins::users-permissions.auth.register',
        resolver: async (obj, options, { context }) => {
        
          context.request.body = _.toPlainObject(options);

          await strapi.plugins['users-permissions'].controllers.auth.verifyOtp(context);
          let output = context.body.toJSON ? context.body.toJSON() : context.body;

          checkBadRequest(output);
          return output;
          
        }
      }
    },

    Mutation: {
      createNewUser: {
        description: "To create a user via app",
        resolverOf: 'plugins::users-permissions.auth.register',
        resolver: async (obj, options, { context }) => {
          return await strapi.plugins['users-permissions'].controllers.auth.createNewUser(context, options);
        }
      },

      UpdateUserReferralCode: {
        description: "update the user referral code",
        resolverOf: 'plugins::users-permissions.auth.callback',
        resolver: async (obj, options, { context }) => {
          return await strapi.plugins['users-permissions'].controllers.auth.UpdateUserReferralCode();
        }
      },

      generateOtp: {
        description: "function to generate Otp",
        resolverOf: 'plugins::users-permissions.auth.callback',
        resolver: async (obj, options, { context }) => {
          return await strapi.plugins['users-permissions'].controllers.auth.generateOtp(options.user);
        }
      },
  
      userlogin: {
        resolverOf: 'plugins::users-permissions.auth.callback',
        resolver: async (obj, options, { context }) => {

          context.request.body = _.toPlainObject(options.input);

          await strapi.plugins['users-permissions'].controllers.auth.userLogin(context);
          let output = context.body.toJSON ? context.body.toJSON() : context.body;

          checkBadRequest(output);
          return {
            user: output.user || output,
            jwt: output.jwt,
          };
        },
      },
    }
  }
}
