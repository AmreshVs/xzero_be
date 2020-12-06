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

    query: 'ApplyCode(receiver: Int!, price: Int!, code: String!): ApplyCodePayLoad',

    resolver: {
      Query: {
        ApplyCode: {
          description: 'function to apply promocode',
          policies: [],
          resolverOf: 'application::promocode.promocode.find',
          resolver: async (obj, options, ctx) => {
            return await strapi.api.promocode.controllers.promocode.ApplyCode(options.receiver, options.price, options.code);
          }
        },
      }
    }
  }