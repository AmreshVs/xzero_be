module.exports = {
  definition: `
    type NotificationByUser {
      id: Int
      title_en: String
      title_ar: String
      desc_en: String
      desc_ar: String
      data: JSON
      status: Boolean
      users: [ID]
      language: ENUM_NOTIFICATIONS_LANGUAGE
      send_to: ENUM_NOTIFICATIONS_SEND_TO
      created_by: ID
      updated_by: ID
      is_read: Boolean
    }
  `,

  query: `
  NotificationsByUser(user_id: Int): [NotificationByUser],
  `,
  resolver: {
    Query: {
      NotificationsByUser: {
        description: 'Return the notifications',
        resolverOf: 'application::notifications.notifications.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api.notifications.controllers.notifications.NotificationsByUser(options.user_id);
        },
      },
    }
  },
};
