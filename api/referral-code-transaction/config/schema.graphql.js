module.exports = {
    definition: ` 
        type ReferralCode {
            discount: String  
            applied: JSON!,
            promoCodeApplied: String,
            discountYouGet: Int
            discountedPrice: Int,
            ApplicableFor: String
		    },
				`
				, 

    mutation: `UseReferralCode(user: Int!): ReferralCode!, `,

    resolver: {
      Mutation: {
        UseReferralCode: {
            description: 'function to apply referral-code',
            policies: [],
            resolverOf: 'application::referral-code-transaction.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api.promocode.controllers.promocode.UseReferralCode(options.user);
            }
          },
      },
    }
  }