'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  
    async MarkAsRead(user, notification) {
     //checking user is exist or not
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
        await strapi.query('notification-read-receipts').update({ id: readExist.id }, {
          notifications_read: newReads.length > 1 ? newReads.join(',') : (newReads.length === 1) ? newReads[0] : null
          });
          status = true;
      } else {
        await strapi.query('notification-read-receipts').create({ user: user, notifications_read: newReads[0] });
          status = true;
      }
      
      return {
        status
      }
    },

  async NotificationCount(user) {
    let count = 0;
    let notifications = await strapi.query('notifications').count({ status: true });
    let readExist = await strapi.query("notification-read-receipts").findOne({ user: user }); 
    if(readExist !==null && (readExist.notifications_read !=="" )) {
      let readCount = readExist.notifications_read.split(",").length;
      count = notifications - readCount;
    }
    return { notificationsCount:count };

  }    

};