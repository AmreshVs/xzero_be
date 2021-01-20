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
    type PublisherLoginPaylod {
      jwt: String
      user: KonozPublishers!
    }

    input PublisherLoginInput {
      email: String!
      password: String!
    }

  `,
  mutation: `
    publisherLogin(input: PublisherLoginInput!): PublisherLoginPaylod!
  `,
  resolver: {
    Mutation: {
      publisherLogin: {
        resolverOf: 'application::konoz-publishers.konoz-publishers.create',
        resolver: async (obj, options, { context }) => {

          context.request.body = _.toPlainObject(options.input);
          
          await strapi.api['konoz-publishers'].controllers['konoz-publishers'].publisherLogin(context);
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
