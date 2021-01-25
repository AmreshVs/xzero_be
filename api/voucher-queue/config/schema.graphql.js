const _ = require("lodash");

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
  definition: ` 
      type Queue {
        queueCount: Int,
        queuedData: VoucherQueue,
        disabled: Boolean,
        msg: JSON!,
      },

      type QueueCheck {
        queueCount: Int,
        msg: JSON!,
      }
      `,
  mutation: `
      VoucherQueue(user: Int!, voucher: Int!): Queue!,
  `,

  query: `QueueCheck(user: Int, voucher: Int!): QueueCheck`,

  resolver: {
    Mutation: {
      VoucherQueue: {
        description: "function for to buy vouchers queuing",
        policies: [],
        resolverOf: "application::voucher-queue.voucher-queue.create",
        resolver: async (obj, options, { context }) => {
          context.request.body = _.toPlainObject(options);
          await strapi.api["voucher-queue"].controllers[
            "voucher-queue"
          ].VoucherQueue(context);
          let output = context.body.toJSON
            ? context.body.toJSON()
            : context.body;
          checkBadRequest(output);
          return {
            queueCount: output.queueCount || output,
            queuedData: output.queuedData,
            msg: output.msg,
            disabled: output.disabled,
          };
        },
      },
    },
    Query: {
      QueueCheck: {
        description: "function for check the queue",
        policies: [],
        resolverOf: "application::voucher-queue.voucher-queue.find",
        resolver: async (obj, options, ctx) => {
          return await strapi.api["voucher-queue"].controllers[
            "voucher-queue"
          ].QueueCheck(options.user, options.voucher);
        },
      },
    },
  },
};
