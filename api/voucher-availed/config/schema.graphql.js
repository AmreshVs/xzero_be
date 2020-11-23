module.exports = {
    mutation: `
        BuyVouchers(user_id: Int!, voucher_id: Int!): VoucherAvailed!,
        DeclareVoucherWinner(id: Int!): VoucherAvailed!
    `,

    resolver: {
      Mutation: {
        BuyVouchers: {
            description: 'function for to buy vouchers',
            policies: [],
            resolverOf: 'application::voucher-availed.voucher-availed.create',
            resolver: async (obj, options, ctx) => {

              return await strapi.api['voucher-availed'].controllers['voucher-availed'].BuyVouchers(options.user_id, options.voucher_id);
            }
          },

          DeclareVoucherWinner: {
            description: 'Declaring voucher winner',
            policies: [],
            resolverOf: 'application::voucher-availed.voucher-availed.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['voucher-availed'].controllers['voucher-availed'].DeclareVoucherWinner(options.id);
            }
        },

      },
    }
  }