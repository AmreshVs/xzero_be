'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {

  async QueueCheck(user, voucher) {
    let voucherAvailed = await strapi.query('voucher-availed').count({ user:user, voucher: voucher });
    if(voucherAvailed) {
      await strapi.query('voucher-queue').delete({user: user, voucher: voucher });
    }
    
    let voucherOnQueue = await strapi.query('voucher-queue').findOne({ user:user, voucher: voucher });
    if(voucherOnQueue) {
      if (voucherOnQueue.created_at < new Date()) {
        voucherOnQueue.created_at.setDate(voucherOnQueue.created_at.getDate() + 1);
    }
    
    var diff = date2 - date1;
    var msec = diff;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;
    
    // 28800000 milliseconds (8 hours)
    }

    let voucherQueueCount = await strapi.query('voucher-queue').count({status: true});
    if(voucherQueueCount >= voucherDetails.limit ) {
      var msg = "Please try again later";
      var disabled = true;
    } else {
      var msg = "Success";
      var disabled = false;
    }

    let create = await strapi.query('voucher-queue').create(queue);
    return { voucherRequested: voucherDetails, msg:msg, disabled: disabled, queueCount: voucherQueueCount }
  }

};
