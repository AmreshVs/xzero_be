'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  // async QueueCheck(user, voucher) {
  //   let r =2;
  //   let voucherQueue = await strapi.query('voucher-queue').find({ status: true, user_status: "pending" });
  //   voucherQueue.forEach(queuedData => {
  //     let voucherAvailed = await strapi.query('voucher-availed').findOne({ user: queuedData.user, voucher: queuedData.voucher });
  //     if(!voucherAvailed && r==3) {
  //       await strapi.query('voucher-queue').delete({user: queuedData.user, voucher: queuedData.voucher });    
  //     } else {
  //       let appBasicInfo = await strapi.query('app-basic-information').findOne();
  //       let startDate = new Date(queuedData.created_at);
  //       let endDate   = new Date();
  //       let seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  //         if(seconds > appBasicInfo.voucher_queue_expiry_seconds) {
  //           await strapi.query('voucher-queue').update({ user: user, voucher: voucher }, { user_status: "idle" });
  //         }          
  //     }
  //   });
 
  //   let voucherOnQueue = await strapi.query('voucher-queue').count({ user_status: "pending", status: true });
  //   let msg = "cron time"+new Date(); 
  //   return { msg:msg, queueCount: voucherOnQueue }

  // }

};
