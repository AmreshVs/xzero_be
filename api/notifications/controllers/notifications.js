'use strict';

const { default: createStrapi } = require("strapi");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async log(ctx) {
        console.log(ctx.request.body);
    },

    
    SendNotificationToSelected: async (ctx) => {
      let params = ctx.request.body;
      let condition = { id_in: params.userIds };
      if(typeof params.lang !== 'undefined' && typeof params.lang !== null) {
        condition = { id_in: params.userIds, language: params.lang };
      }
      let users = await strapi.query('user', 'users-permissions').find(condition);
      return ctx.send ({
        users
      })
    },

    SendNotificationToNonUsers: async (ctx) => {
      
      let users = await strapi.query('non-users').find({ status: true,  notification_token_ne: null||'' });
      return ctx.send ({
        users
      })
    },

    async NotificationsByUser(user_id = null) {
      let is_read = false
      let notifications = await strapi.query('notifications').find({ status: true, _sort: 'id:desc' });
      let read = await strapi.query('notification-read-receipts').findOne({ user: user_id });
      return Promise.all(notifications.map(async (notification) => {
        
        if(read !== null) {
          let readNotification = read.notifications_read || "";
          is_read = readNotification.includes(notification.id);
        }
        
        // if(user_id !== null && notification.users.length !==0 )  {
        //   let notificationToSpecifieduser = notification.users.map(x => {
        //     return x.id });
            
        //   if(notificationToSpecifieduser.includes(user_id) === false) {
            
        //     var index = notifications.map(x => {
        //        return x.id;
        //     }).indexOf(notification.id);
            
        //     return;
            
            
        //     //notification.splice(index, 1);
              
        //   } 
        
        // } 

        return Promise.resolve({
          ...notification,
          is_read
        });

      }));

    }
  
};
