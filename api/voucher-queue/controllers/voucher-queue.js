'use strict';

const { default: createStrapi } = require("strapi");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async BuyNowQueue(user, voucher) {
    let queue = { user: user, voucher:voucher };
    let voucherDetails = await strapi.query('vouchers').findOne({ id:voucher });
    
    let voucherQueueCount = await strapi.query('voucher-queue').count({ status: true });
    if(voucherQueueCount >= voucherDetails.limit ) {
      var msg = "Please try again later";
      var disabled = true;
    } else {
      var msg = "Success";
      var disabled = false;
    }

    let create = await strapi.query('voucher-queue').create(queue);
    return { voucherRequested: voucherDetails, msg:msg, disabled: disabled, queueCount: voucherQueueCount }
  },

  async QueueCheck(user, voucher) {
    
    let voucherAvailed = await strapi.query('voucher-availed').count({ user:user, voucher: voucher });
    if(!voucherAvailed) {
     // await strapi.query('voucher-queue').delete({user: user, voucher: voucher });
    } else {
      let voucherOnQueue = await strapi.query('voucher-queue').findOne({ user: user, voucher: voucher });
      //console.log(voucherOnQueue); return false;

      let dt = new Date();
      let localTime = dt.getTime(); 
      let localOffset = dt.getTimezoneOffset(); 
      let utc = localTime + localOffset;
      let offset = 4; // GST (Gulf Standard Time) ahead +4 hours from utc
      let currentDateTime = utc + (3600000*offset); 
      let current = new Date(currentDateTime); 

      if(voucherOnQueue) {
        if (voucherOnQueue.created_at < current) {
          voucherOnQueue.created_at.setDate(voucherOnQueue.created_at.getDate() + 1);
      }

      var diff = current - voucherOnQueue.created_at;
      var diffE = voucherOnQueue.created_at - current;
      
      var msec = diff;
      var hh = Math.floor(msec / 1000 / 60 / 60);
      msec -= hh * 1000 * 60 * 60;
      var mm = Math.floor(msec / 1000 / 60);
  

      if(mm>30) {
        await strapi.query('voucher-queue').delete({user: user, voucher: voucher });
      }
    
      }
    }
    
    let voucherOnQueue = await strapi.query('voucher-queue').count({status: true});
    //console.log(voucherOnQueue); return false;
    
    var msg = "success"; 
    return { msg:msg, queueCount: voucherOnQueue }
  }

};
