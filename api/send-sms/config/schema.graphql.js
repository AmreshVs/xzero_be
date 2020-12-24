module.exports = {

  query: `SendBulkSms(Id: Int!): JSON`,

  resolver: {
    Query: {
      SendBulkSms: {
          description: 'function to send sms',
          policies: [],
          resolverOf: 'application::send-sms.send-sms.find',
          resolver: async (obj, options, ctx) => {
            return await strapi.api['send-sms'].controllers['send-sms'].SendBulkSms(options.id);
          }
        },
    },
  }

}