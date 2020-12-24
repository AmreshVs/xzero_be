'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  async SendBulkSms(Id) {
    let smsContent = await strapi.query('send-sms').findOne({ id: Id });
    if(smsContent !== null ) {
      let usersForSms = smsContent.users;
      if(smsContent.users.length === 0) {
         usersForSms = await strapi.query('user', 'users-permissions').find({ id:132,  mobile_number_null: false,  mobile_number_ne: 0, _sort: 'id:desc', _limit: 1 });
      }
      let unicode = false; 
      let msg = smsContent.text_en;
      let type = smsContent.type;
      if( smsContent.lang === "Arabic" ) {
        unicode = true; 
        msg = smsContent.text_ar
      }

      await Promise.all(usersForSms.map(async (user) => {
        let send = await strapi.services.sms.SendMessage("971526848995  ", msg, unicode, type);
        if(send === true) {
          return true
        }
        return false;
      }));

    }

  }
};
