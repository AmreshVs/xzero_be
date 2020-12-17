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
        type BoughtVoucher {
            codeStatus: JSON,
            disabled: Boolean,
            bought: JSON!,
            voucherAvailed: VoucherAvailed
        },

				`
				, 

    mutation: `
        BuyVoucher(user_id: ID!, voucher_id: Int!, code: String): BoughtVoucher!,
    `,

    query: `DeclareVoucherWinner(id: Int!, draw_status: String): JSON`,

    resolver: {
      Mutation: {
        BuyVoucher: {
            description: 'function for to buy vouchers',
            policies: [],
            resolverOf: 'application::voucher-availed.voucher-availed.create',
            resolver: async (obj, options, ctx) => {
              return await strapi.api['voucher-availed'].controllers['voucher-availed'].BuyVoucher(options.user_id, options.voucher_id, options.code);
            }
          },
      },

      Query: {
        DeclareVoucherWinner: {
          description: 'function for to declare voucher winner',
          policies: [],
          resolverOf: 'application::voucher-availed.voucher-availed.find',
          resolver: async (obj, options, {context}) => {
        
          context.request.body = _.toPlainObject(options);
          await strapi.api['voucher-availed'].controllers['voucher-availed'].DeclareVoucherWinner(context);
          let output = context.body.toJSON ? context.body.toJSON() : context.body;
          checkBadRequest(output);
          return output;

          }
        },
      }

    }
  }