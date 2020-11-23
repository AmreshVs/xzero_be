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

    `,

    mutation: `
        GenerateVoucherWinner(user_id: Int!, plan_id: Int!): UserVoucher!,
        DeclareVoucherWinner: VoucherAvailed!,
        FinalizeWinner: VoucherAvailed!,
        
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

        DeclareVoucherWinner: {
            description: 'Declaring voucher winner',
            policies: [],
            resolverOf: 'application::vouchers.vouchers.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api.vouchers.controllers.vouchers.DeclareVoucherWinner();
            }
        },
        FinalizeWinner: {
            description: 'complete the voucher process and publish the winnner',
            policies: [],
            resolverOf: 'application::vouchers.vouchers.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api.vouchers.controllers.vouchers.FinalizeWinner();
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