module.exports = {
  mutation: `
    generateOtp(user: ID!): Otp
  `,
 
  resolver: {
    Mutation: {
      generateOtp: {
        description: 'Generate Otp',
        resolverOf: 'application::otp.otp.create',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.otp.controllers.otp.generateOtp(options.user);
        },
      },
      
    }
  },
};
