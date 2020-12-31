'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];


module.exports = {
  async SendBulkSms(ctx) {
    let params = ctx.request.body;
    let Id = params.id;
    let smsContent = await strapi.query('send-sms').findOne({ id: Id });
    let smsInfo = await strapi.query('sms').findOne({ status: true });
    var status = false;
    if(smsContent !== null && smsInfo !== null) {
      let usersForSms = smsContent.users;
      if(smsContent.users.length === 0) {
         usersForSms = await strapi.query('user', 'users-permissions').find({ mobile_number_null: false,  mobile_number_ne: 0, _sort: 'id:desc', _limit: 1 });
      }
      let unicode = false; 
      let msg = smsContent.text_en;
      let type = smsContent.type;
      if( smsContent.lang.toLowerCase() === "arabic" ) {
        unicode = true; 
        msg = smsContent.text_ar
      }
      
      await Promise.all(usersForSms.map(async (user) => {
        if(smsContent.lang === "User_language") {
          if(user.language === "en") {
            unicode = false; 
            msg = smsContent.text_en;
          } else if(user.language === "ar") {
            unicode = true; 
            msg = smsContent.text_ar;
          }
        }

        

        let send = await strapi.services.sms.SendMessage(user.mobile_number, msg, unicode, type);
        if(send === true) {
          status = true;
          await strapi.query('sms').update({ id: smsInfo.id }, {
            total_sms_sent: parseInt(smsInfo.total_sms_sent)+1
          });
        }
      }));
      
      return ctx.send(
        status
      ); 
    }

  }

};
