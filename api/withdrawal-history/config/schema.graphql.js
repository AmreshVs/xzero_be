const _ = require('lodash');
/**
 * Throws an ApolloError if context body contains a bad request
 * @param contextBody - body of the context object given to the resolver
 * @throws ApolloError if the body is a bad request
 */
function checkBadRequest(contextBody) {
  if (_.get(contextBody, 'statusCode', 200) !== 200) {
    const message = _.get(contextBody, 'error', 'Bad Request');
    const exception = new Error(message);
    exception.code = _.get(contextBody, 'statusCode', 400);
    exception.data = contextBody;
    throw exception;
  }
}


module.exports = {
    definition: ` 
        type TransactionPayLoad {
            msg: String,
            withdrawal: WithdrawalHistory
        },
	    `
		, 

    mutation: `WithdrawMoney(user: Int!, withdrawAmount: Int!, status: String): TransactionPayLoad`,
    

    resolver: {
      Mutation: {
          WithdrawMoney: {
            description: 'function to apply for money withdrawal',
            policies: [],
            resolverOf: 'application::withdrawal-history.withdrawal-history.find',
           
            resolver: async (obj, options, {context}) => {
              context.request.body = _.toPlainObject(options);
              await strapi.api['withdrawal-history'].controllers['withdrawal-history'].WithdrawMoney( context );
              let output = context.body.toJSON ? context.body.toJSON() : context.body;
              checkBadRequest(output);
              return output
            },

          },
      },
    }
  }