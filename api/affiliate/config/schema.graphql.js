module.exports = {
    definition: ` 
        type ApplyReferralCode {
            discount: Float
            applied: JSON!,
            ReferralCodeApplied: String,
            discountYouGet: Float
            discountedPrice: Float,
            ApplicableFor: String
		    },
				`
				, 

    mutation: `ApplyReferralCode(user: Int!, price: Int!, referral_code: String!): ApplyReferralCode!, `,

    resolver: {
      Mutation: {
        ApplyReferralCode: {
            description: 'function to apply referral code',
            policies: [],
            resolverOf: 'application::affiliate.affiliate.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api.affiliate.controllers.affiliate.ApplyReferralCode(options.user, options.price, options.referral_code);
            }
          },
      },
    }
  }