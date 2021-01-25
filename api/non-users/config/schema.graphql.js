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
  mutation: `AddNotificationToken(token: String, lang: String): NonUsers`,

  resolver: {
    Mutation: {
      AddNotificationToken: {
        description: "function will add the notification token when they open",
        policies: [],
        resolverOf: "application::non-users.non-users.create",
        resolver: async (obj, options, { context }) => {
          context.request.body = _.toPlainObject(options);
          await strapi.api["non-users"].controllers[
            "non-users"
          ].AddNotificationToken(context);
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
