
module.exports = {
    definition: ` 
        type TransactionPayLoad {
            msg: String,
            withdrawal: WithdrawalHistory  
        },
	    `
		, 

    mutation: `
    WithdrawMoney(user: Int!, withdrawamount: Int!, status: String): TransactionPayLoad
    `,

    resolver: {
      Mutation: {
          WithdrawMoney: {
            description: 'function to apply for money withdrawal',
            policies: [],
            resolverOf: 'application::withdrawal-history.withdrawal-history.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['withdrawal-history'].controllers['withdrawal-history'].WithdrawMoney( options.user, options.withdrawamount,options.status );
            }
          },
      },
    }
  }