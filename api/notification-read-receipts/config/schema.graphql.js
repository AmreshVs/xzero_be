
module.exports = {
  

  query: `notificationCount(user: Int!):Int`,

  mutation: 
  `MarkAsRead(user: Int!, notification: Int!): JSON!
   
  `,
  resolver: {
      Mutation: {
          MarkAsRead: {
            description: 'adding the read notification',
            //policies: ['plugins::users-permissions.isAuthenticated'],
            resolverOf: 'application::notification-read-receipts.notification-read-receipts.create',
            resolver: async (obj, options, ctx) => {
                return await strapi.api['notification-read-receipts'].controllers['notification-read-receipts'].MarkAsRead(options.user, options.notification);
            }
          }
      },

      Query: {
        notificationCount: {
          description: 'getting the unread count of notification',
          //policies: ['plugins::users-permissions.isAuthenticated'],
          resolverOf: 'application::notification-read-receipts.notification-read-receipts.find',
          resolver: async (obj, options, ctx) => {
              return await strapi.api['notification-read-receipts'].controllers['notification-read-receipts'].NotificationCount(options.user);
          }
        }
      }

    
  }
}