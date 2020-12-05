
module.exports = {
    definition: ` 
        type TransactionHistory {
            userBankDetails: BankDetails,
            withdrawalHistory: [WithdrawalHistory],
        },
	    `
		, 

    query: `TransactionInfo(user: Int!): TransactionHistory`,

    resolver: {
      Query: {
        TransactionInfo: {
            description: 'function to apply for money withdrawal',
            policies: [],
            resolverOf: 'application::bank-details.bank-details.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['bank-details'].controllers['bank-details'].TransactionInfo(options.user);
            }
          },
      },
    }
  }