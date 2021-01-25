const _ = require("lodash");
/**
 * Throws an ApolloError if context body contains a bad request
 * @param contextBody - body of the context object given to the resolver
 * @throws ApolloError if the body is a bad request
 */
function checkBadRequest(contextBody) {
  if (_.get(contextBody, "statusCode", 200) !== 200) {
    const message = _.get(contextBody, "error", "Bad Request");
    const exception = new Error(message);
    exception.code = _.get(contextBody, "statusCode", 400);
    exception.data = contextBody;
    throw exception;
  }
}

module.exports = {
  query: `SendBulkSms(id: Int!): JSON`,

  resolver: {
    Query: {
      SendBulkSms: {
        description: "function to send sms",
        policies: [],
        resolverOf: "application::send-sms.send-sms.find",
        resolver: async (obj, options, { context }) => {
          context.request.body = _.toPlainObject(options);
          await strapi.api["send-sms"].controllers["send-sms"].SendBulkSms(
            context
          );
          let output = context.body.toJSON
            ? context.body.toJSON()
            : context.body;
          checkBadRequest(output);
          return output;
        },
      },
    },
  },
};
