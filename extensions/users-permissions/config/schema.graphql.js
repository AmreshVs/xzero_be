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

    type otpVerification {
      msg: String,
      status: Boolean
    }

    type SmsInfo {
      otp: String
      msg: String
      status: Boolean
      balance: Float
    }
    input UserLoginInput {
        identifier: String!
        password: String!
        provider: String = "local"
        device_id: String
        app_version: String
        platform: String
    }
  `,
  mutation: `
    createNewUser(input: UserInput!): CreateUserPayload!
    userlogin(input: UserLoginInput): CreateUserPayload!
    UpdateUserReferralCode(user: Int): JSON
    SendSms(user: Int!, mobile: String, lang: String, email: Boolean): SmsInfo
  `,

  query: `verifyOtp(user: ID!, otp: Int): otpVerification`,

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
          return output

        }
      }
    },

    Mutation: {
      createNewUser: {
        description: "To create a user via app",
        resolverOf: 'plugins::users-permissions.auth.register',
        resolver: async (obj, options, { context }) => {
          return await strapi.plugins['users-permissions'].controllers.auth.createNewUser(context, { ...options.input });
        }
      },

      UpdateUserReferralCode: {
        description: "update the user referral code",
        resolverOf: 'plugins::users-permissions.auth.callback',
        resolver: async (obj, options, { context }) => {
          return await strapi.plugins['users-permissions'].controllers.auth.UpdateUserReferralCode(options.user );
        }
      },

      SendSms: {
        description: 'function to verify otp',
        policies: [],
        resolverOf: 'plugins::users-permissions.auth.callback',
        resolver: async (obj, options, { context }) => {

          context.request.body = _.toPlainObject(options);
          await strapi.plugins['users-permissions'].controllers.auth.SendSms(context);
          let output = context.body.toJSON ? context.body.toJSON() : context.body;
          checkBadRequest(output);
          return output;
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
