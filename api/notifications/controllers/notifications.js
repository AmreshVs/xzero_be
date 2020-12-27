'use strict';

const { default: createStrapi } = require("strapi");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async log(ctx) {
        console.log(ctx.request.body);
    },

    
    SendNotificationToSelected: async (ctx) => {
      let params = ctx.request.body;
      let users = await strapi.query('user', 'users-permissions').find({ id_in: params.userIds });
      return ctx.send ({
        users
      })
  },
};
