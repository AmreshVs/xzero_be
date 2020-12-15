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
        type ApplyCodePayLoad {
          discount: String,  
          applied: Boolean!,
          codeApplied: String,
          from: String,
          discountYouGet: Int,
          discountedPrice: Int,
          applicableFor: String,
          msg: JSON
      }
				`
			, 

    query: 'ApplyCode(receiver: Int!, price: Int!, code: String!, plan: Int, voucher: Int): ApplyCodePayLoad',

    resolver: {
      Query: {
        ApplyCode: {
          description: 'function to apply promocode',
          policies: [],
          resolverOf: 'application::promocode.promocode.find',
          resolver: async (obj, options, { context }) => {
            //return await strapi.api.promocode.controllers.promocode.ApplyCode(options.receiver, options.price, options.code);
            context.request.body = _.toPlainObject(options);
            await strapi.api.promocode.controllers.promocode.ApplyCode(context);
            let output = context.body.toJSON ? context.body.toJSON() : context.body;
            checkBadRequest(output);

            return output;

            // return { 
            //   discount: output.discount || output,
            //   applied: output.applied,
            //   codeApplied: output.codeApplied,
            //   from: output.from,

            //   discountYouGet: output.discountYouGet,
            //   discountedPrice: output.discountedPrice,
            //   applicableFor: output.applicableFor,
            //   msg: output.msg

            //       }

            

          }
        },
      }
    }
  }