module.exports = {
  definition: `
    type AvailableVouchers {
      vouchers: [Vouchers],
      AvailedVouchers: [VoucherAvailed]!,
    }
  `,
  query: 'AvailableVouchers(where: JSON): AvailableVouchers!',
  resolver: {
    Query: {
      AvailableVouchers: {
        description: 'Return the added vouchers',
        resolverOf: 'application::vouchers.vouchers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.vouchers.controllers.vouchers.AvailableVouchers(options.where || {});
        },
      },
    },
  }
}