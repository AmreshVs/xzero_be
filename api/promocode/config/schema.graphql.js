module.exports = {
    definition: ` 
        type ApplyPromoCode {
            discount: String  
            applied: JSON!,
            promoCodeAapplied: String,
            discountYouGet: Int
            discountedPrice: Int,
		    },
				`
				, 

    mutation: `ApplyPromocode(user: Int!, price: Int!, promocode: String!): ApplyPromoCode!, `,

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
    }
  }