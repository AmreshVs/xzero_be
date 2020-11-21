
module.exports = {
    definition: `
      type UserVoucher {
        disabled: Boolean,
        won: Boolean!,
        voucher: Vouchers
      }

      type AvailableVouchers {
        vouchers: [Vouchers],
        AvailedVouchers: [VoucherAvailed]!,

      }

      type VouchersPayLoad {
        VoucherBought: VoucherAvailed
      }

    `,

    mutation: `
        GenerateVoucherWinner(user_id: Int!, plan_id: Int!): UserVoucher!,
        BuyVouchers(user_id: Int!, voucher_id: Int!): VouchersPayLoad!
    `,

    query: 'AvailableVouchers(where: JSON): AvailableVouchers!',

    resolver: {
      Mutation: {
        GenerateVoucherWinner: {
          description: 'Randomly selecting voucher winner with their respective plans',
          policies: [],
          resolverOf: 'application::vouchers.vouchers.find',
          resolver: async (obj, options, ctx) => {
            return await strapi.api.vouchers.controllers.vouchers.GenerateVoucherWinner(options.user_id, options.plan_id);
          }
        },

        BuyVouchers: {
            description: 'function for to buy vouchers',
            policies: [],
            resolverOf: 'application::vouchers.vouchers.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api.vouchers.controllers.vouchers.BuyVouchers(options.user_id, options.voucher_id);
            }
          }
      },

  
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