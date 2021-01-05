'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  
    async MarkAsRead(user, notification) {
     //checking user is exist or not
     let count = 0;
     let totalNotifications = await strapi.query("notifications").count({ status: true }); 
     let readExist = await strapi.query("notification-read-receipts").findOne({ user: user }); 
     let userReads  = '';
     if(readExist!==null) {
        userReads = readExist.notifications_read;
     }
     
     let newReads = [];
     let status = false;
     let pop = false;
     // Pop
    if (userReads !== null && userReads.includes(',')) {
      userReads.replace(' ', '');
        newReads = userReads.split(',');
        
      }
  
      if (userReads !== null && userReads !== '' && !userReads.includes(',')) {
        newReads.push(String(userReads));
      }
  
      if (newReads.includes(String(notification))) {
        newReads = newReads.filter((fav) => Number(fav) !== Number(notification));
        
      }
  
      if (pop === false) {
        // Push
        if (userReads === null || userReads === '') {
          newReads.push(Number(notification));
          status = true;
        }
        else {
          newReads.push(Number(notification));
            status = true;
        }
      }

      if(readExist !== null) {
        var receipts = await strapi.query('notification-read-receipts').update({ id: readExist.id }, {
          notifications_read: newReads.length > 1 ? newReads.join(',') : (newReads.length === 1) ? newReads[0] : null
          });
          status = true;
      } else {
        var receipts = await strapi.query('notification-read-receipts').create({ user: user, notifications_read: newReads[0] });
          status = true;
      }
      
      if(receipts && receipts.notifications_read !== "") {
        let redNotification = receipts.notifications_read.split(",").length; 
        count = totalNotifications - redNotification;
      }

      return {
        status: status, notificationCount: count >0? count: 0
      }
    },

  async NotificationCount(user) {
    let notifications = await strapi.query('notifications').count({ status: true });
    let count = notifications;
    let readExist = await strapi.query("notification-read-receipts").findOne({ user: user }); 
    if(readExist !==null && (readExist.notifications_read !=="" )) {
      let readCount = readExist.notifications_read.split(",").length;
      count = notifications - readCount;
    }
    return count;

  }    

};