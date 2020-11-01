'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

const membershipEmailTemplate = require('../membershipEmailTemplate');

async function sendMail(user_id) {
  let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id });
  try {
    const emailTemplate = {
      subject: 'Xzero Membership Purchased!',
      text: `Thank You for purchasing our membership`,
      html: membershipEmailTemplate,
    };
    // Send an email to the user.
    await strapi.plugins['email'].services.email.sendTemplatedEmail(
      {
        to: user.email,
        from: "support@xzero.app",
      },
      emailTemplate,
    );
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  async generateMembership(user_id, amount) {
    function generateMemberId(length) {
      var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var result = '';
      for (var i = 0; i < length; i++) {
        if ((i % 5 === 0) && (i != 0) && (i != length - 1))
          result += "-";
        else
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
      }
      return result;
    }

  
    

    let checkUserExist = await strapi.query('membership').findOne({ user: user_id });

    if (checkUserExist === null) {
      let expiry_date = new Date();
      let serial = generateMemberId(16);
      let membership = await strapi.query('membership').create({ serial: serial, user: user_id, expiry: expiry_date.addDays(365) });
      await strapi.query('membership-transactions').create({ membership_id: membership.id, serial: serial, type: 'New', expiry: expiry_date, amount });
      sendMail(user_id);
      return membership;
    }
    else {
      let serial = generateMemberId(16);
      await strapi.query('membership-transactions').create({ membership_id: checkUserExist.id, serial: serial, type: 'Renewal', expiry: checkUserExist.expiry, amount });
      return await strapi.query('membership').update({ user: user_id }, { serial: serial, expiry: new Date(checkUserExist.expiry).addDays(365) });
    }
  },


  // function CheckSerialExist(serialhash) {
  //   let checkUserExist = await strapi.query('membership').findOne({ user: user_id });
  //   let SerialExist = await strapi.query('membership').findOne({ serial: serialhash }); 
  //   if(empty(SerialExist)) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // async CheckSerialExist(user_id) {
  //   let checkUserExist = await strapi.query('membership').findOne({ user: user_id });
  //   return checkUserExist;
  // }

};
