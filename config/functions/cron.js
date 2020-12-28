'use strict';

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#cron-tasks
 */

// module.exports = {
//   /**
//    * Simple example.
//    * Every monday at 1am.
//    */
//   // '0 1 * * 1': () => {
//   //
//   // }  
// };

const _ = require('lodash');
const fetch = require("node-fetch");

async function QueueCheck() {  
  let voucherQueue = await strapi.query('voucher-queue').find({ status: true, user_status: "pending" });

  await Promise.all(voucherQueue.map(async (queuedData) => {
    let voucherAvailed = await strapi.query('voucher-availed').findOne({ user: queuedData.user.id, voucher: queuedData.voucher.id });
    if(!voucherAvailed ) {
        await strapi.query('voucher-queue').delete({user: queuedData.user.id, voucher: queuedData.voucher.id });    
    } else {
      let appBasicInfo =  await strapi.query('app-basic-information').findOne();

      let startDate = await strapi.services['app-basic-information'].CurrentDateTime(queuedData.created_at);
      let endDate   = await strapi.services['app-basic-information'].CurrentDateTime()
  
      let seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    
        if(seconds > appBasicInfo.voucher_queue_expiry_seconds) {
          await strapi.query('voucher-queue').update({ user: queuedData.user.id, voucher: queuedData.voucher.id }, { user_status: "idle" });
        }          

        if(seconds > appBasicInfo.voucher_queue_delete_after ) {
          await strapi.query('voucher-queue').update({ id: queuedData.id }, { status: false, user_status: "tried" });
        }
    }
  }));

  let voucherOnQueue = await strapi.query('voucher-queue').count({ user_status: "pending", status: true });

  let usersIdle = await strapi.query('voucher-queue').find({ user_status: "idle", status: true, is_notified: false || null });

  if(voucherOnQueue === 0 && usersIdle !== null) {

    //let usersIdle = await strapi.query('voucher-queue').find({ user_status: "idle", status: true });

    let expoTokens = [];
    
    await Promise.all(usersIdle.map( async (userIdle) => {
      
      if ((userIdle.user.notification_token !== null) && (userIdle.user.notification_token !== '')) {

        await strapi.query('voucher-queue').update({ id: userIdle.id },  { status: false, is_notified: true });

        if(expoTokens.includes(userIdle.user.notification_token) === false) expoTokens.push(userIdle.user.notification_token);
       
        return true;

      }
      return false;
      
    }))

    

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'accept': 'application/json',
          'accept-encoding': 'gzip, deflate',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          to: expoTokens,
          title: "Xzero voucher available",
          body: "You have tried to buy xzero voucher",
          sound: 'default',
          priority: 'high'
        })
      });

    }
    catch (e) {
      console.log('Notification Push', e)
    }
  
  }
 
  console.log(voucherOnQueue, "on queue" ); 
}


module.exports = {
  '*/200 * * * * *': () => {
    QueueCheck();
  },
  options: {
    tz: "Asia/Dubai"
  }
};


// module.exports = {
//   '*/2 * * * * *': () => {
//     console.log('5 seconds later'); 
//   },
// };
