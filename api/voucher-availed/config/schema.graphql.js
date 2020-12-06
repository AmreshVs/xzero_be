module.exports = {

    definition: ` 
        type BoughtVoucher {
            codeStatus: JSON,
            disabled: Boolean,
            bought: JSON!,
            voucherAvailed: VoucherAvailed
				},
				`
				, 

    mutation: `
        BuyVoucher(user_id: ID!, voucher_id: Int!, code: String): BoughtVoucher!,
    `,

    resolver: {
      Mutation: {
        BuyVoucher: {
            description: 'function for to buy vouchers',
            policies: [],
            resolverOf: 'application::voucher-availed.voucher-availed.create',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['voucher-availed'].controllers['voucher-availed'].BuyVoucher(options.user_id, options.voucher_id, options.code);
            }
          },
      },
    }
  }