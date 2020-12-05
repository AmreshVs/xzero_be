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
          discount: String  
          applied: JSON!,
          CodeApplied: String,
          from: String
          discountYouGet: Int
          discountedPrice: Int,
          applicableFor: String
      }
				`
				, 

    mutation: `
      ApplyPromocode(user: Int!, price: Int!, promocode: String!): ApplyPromoCode!,
      ApplyCode(receiver: Int!, price: Int!, code: String!): ApplyCodePayLoad
    `,

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
          ApplyCode: {
            description: 'function to apply promocode',
            policies: [],
            resolverOf: 'application::promocode.promocode.find',
            resolver: async (obj, options, ctx) => {
              return await strapi.api.promocode.controllers.promocode.ApplyCode(options.receiver, options.price, options.code);
            }
          },
      },
    }
  }