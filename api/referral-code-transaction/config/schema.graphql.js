module.exports = {
  definition: ` 
            
        type ReferralHistory {
            referProgram : ReferralProgram,
            label: JSON,
            referralCode: JSON 
            totalEarned: Float, 
            totalReferred: Int , 
            balance: Float
          }
      `,

  query: `GetReferHistory(referrer: Int): ReferralHistory`,

  resolver: {
    Query: {
      GetReferHistory: {
        description: "referral code transactions",
        policies: [],
        resolverOf: "application::referral-code-transaction.referral-code-transaction.find",
        resolver: async (obj, options, ctx) => {
          return await strapi.api["referral-code-transaction"].controllers[
            "referral-code-transaction"
          ].GetReferHistory(options.referrer);
        },
      },
    },
  },
};
