module.exports = {
    definition: ` 
        type ApplyPromoCode {
            discount: String  
            applied: JSON!,
            promoCodeApplied: String,
            discountYouGet: Int
            discountedPrice: Int,
            applicableFor: String
        },
        
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

    mutation: `
      ApplyPromocode(user: Int!, price: Int!, promocode: String!): ApplyPromoCode!,
      
    `,

    query: 'ApplyCode(receiver: Int!, price: Int!, code: String!): ApplyCodePayLoad',

    resolver: {
      Mutation: {
        ApplyPromocode: {
            description: 'function to apply promocode',
            policies: [],
            resolverOf: 'application::promocode.promocode.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api.promocode.controllers.promocode.ApplyPromocode(options.user, options.price, options.promocode);
            }
          },
      },
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