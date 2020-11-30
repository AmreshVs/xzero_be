
module.exports = {
    definition: ` 
        type ReferralCodeH {
            discount: String  
            applied: JSON!,
            referralCodeAppliedInfo: String,
            discountYouGet: Int
            discountedPrice: Int,
            applicableFor: String,
            referrerCredit: Int,
            from: String
		    },
			`
	, 

    mutation: `ApplyReferral(receiver: Int!, price: Int!, referral_code: String!): ReferralCodeH!, `,

    resolver: {
      Mutation: {
        ApplyReferral: {
            description: 'referral code transactions',
            policies: [],
            resolverOf: 'application::referral-code-transaction.referral-code-transaction.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['referral-code-transaction'].controllers['referral-code-transaction'].ApplyReferral(options.receiver, options.price, options.referral_code);
            }
          },
      },
    }
  }