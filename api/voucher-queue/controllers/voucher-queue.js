'use strict';



/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
]; 

module.exports = {
  async BuyNowQueue(ctx) {
    let params = ctx.request.body;
    let user = params.user;
    let voucher = params.voucher; 
    let queue = { user: user, voucher:voucher, user_status : "pending" };
    let voucherDetails = await strapi.query('vouchers').findOne({ id:voucher });
    let voucherQueueCount = await strapi.query('voucher-queue').count({ user_status: "pending", status: true });
    
      if( voucherQueueCount > voucherDetails.limit ) {
        
        var disabled = true;
        return ctx.badRequest(
          null,
          formatError({
            id: 'queue.maximum.limi.error',
            message: 'Maximum limit reached, Please try again ',
          })
        );
        
      } else {
        var msg = "Success";
        var disabled = false;
      }

      if(voucherQueueCount < voucherDetails.limit) {
        var create = await strapi.query('voucher-queue').create(queue);
      } else {
        let queued = { user: user, voucher:voucher, user_status : "queued"  };
        var create = await strapi.query('voucher-queue').create(queued);
      }  
    
      return ctx.send({
        queuedData: create, 
        msg: msg,
        disabled: disabled, 
        queueCount: voucherQueueCount
      });

  },

  async QueueCheck(user, voucher) {
    let voucherAvailed = await strapi.query('voucher-availed').count({ user:user, voucher: voucher });
    if(!voucherAvailed) {
     await strapi.query('voucher-queue').delete({user: user, voucher: voucher });
    } else {
      let appBasicInfo = await strapi.query('app-basic-information').findOne();
      let voucherOnQueue = await strapi.query('voucher-queue').findOne({ user: user, voucher: voucher });
    
      if(voucherOnQueue) {
        var startDate = new Date(voucherOnQueue.created_at);
        var endDate   = new Date();
        var seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
        if(seconds > appBasicInfo.voucher_queue_expiry_seconds) {
          await strapi.query('voucher-queue').update({ user: user, voucher: voucher }, { user_status: "idle" });
        } 
      }
    }
    
    let voucherOnQueue = await strapi.query('voucher-queue').count({ user_status: "pending", status: true });
    var msg = "success"; 
    return { msg:msg, queueCount: voucherOnQueue }
  }

};
