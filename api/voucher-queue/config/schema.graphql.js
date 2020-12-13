module.exports = {

  definition: ` 
      type BuyNow {
          queueCount: Int,
          disabled: Boolean,
          msg: JSON!,
          voucherRequested: VoucherQueue
      },

      type QueueCheck {
        queueCount: Int,
        msg: JSON!,
      }

      `
      , 

  mutation: `
    BuyNowQueue(user: Int!, voucher: Int!): BuyNow!,
    QueueCheck(user: Int, voucher: Int!): QueueCheck
  `,

  resolver: {
    Mutation: {
      BuyNowQueue: {
          description: 'function for to buy vouchers queuing',
          policies: [],
          resolverOf: 'application::voucher-queue.voucher-queue.create',
          resolver: async (obj, options, ctx) => {
            return await strapi.api['voucher-queue'].controllers['voucher-queue'].BuyNowQueue(options.user, options.voucher);
          }
        },

        QueueCheck: {
          description: 'function for to buy vouchers queuing',
          policies: [],
          resolverOf: 'application::voucher-queue.voucher-queue.create',
          resolver: async (obj, options, ctx) => {
            return await strapi.api['voucher-queue'].controllers['voucher-queue'].QueueCheck(options.user, options.voucher);
          }
        },


    },
  }
}