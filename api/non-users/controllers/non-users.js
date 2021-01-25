"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  async AddNotificationToken(ctx) {
    let params = ctx.request.body;
    let addToken;
    if (params) {
      const sanitizedParams = sanitizeEntity(
        params.toJSON ? params.toJSON() : params,
        {
          model: strapi.query("non-users").model,
        }
      );
      addToken = await strapi
        .query("non-users")
        .create({
          notification_token: sanitizedParams.token,
          lang: sanitizedParams.lang,
          status: true,
        });
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "non-users.params.missing",
          message: "required field is missing",
        })
      );
    }
    return ctx.send(addToken);
  },
};
