module.exports = {

    definition: ` 
        type BoughtVoucher {
            disabled: Boolean,
            bought: JSON!,
            VoucherAvailed: VoucherAvailed
				},
				`
				, 

    mutation: `
        BuyVoucher(user_id: Int!, voucher_id: Int!): BoughtVoucher!,
    `,

    resolver: {
      Mutation: {
        BuyVoucher: {
            description: 'function for to buy vouchers',
            policies: [],
            resolverOf: 'application::voucher-availed.voucher-availed.create',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['voucher-availed'].controllers['voucher-availed'].BuyVoucher(options.user_id, options.voucher_id);
            }
          },
      },
    }
  }