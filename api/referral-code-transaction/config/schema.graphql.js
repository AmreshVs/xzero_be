
module.exports = {
    definition: ` 
        type ReferralCodeH {
            discount: String  
            applied: JSON!,
            referralCodeAppliedInfo: String,
            discountYouGet: Float
            discountedPrice: Int,
            applicableFor: String,
            referrerCredit: Float,
            from: String
            },
            
        type ReferralHistory {
            referProgram : ReferralProgram,
            label: JSON,
            referralCode: JSON 
            totalEarned: Float, 
            totalReferred: Int , 
            balance: Float
            },
			`
	, 

    mutation: `ApplyReferral(receiver: Int!, price: Int!, referral_code: String!): ReferralCodeH! `,
    query: `GetReferHistory(referrer: Int): ReferralHistory`,

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
      Query: {
        GetReferHistory:{
            description: 'referral code transactions',
            policies: [],
            resolverOf: 'application::referral-code-transaction.referral-code-transaction.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['referral-code-transaction'].controllers['referral-code-transaction'].GetReferHistory(options.referrer);
            }  
        }
      }
    }
  }