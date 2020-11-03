'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
var QRCode = require('qrcode');
const membershipEmailTemplate = require('../membershipEmailTemplate');
const membershipRenewalEmailTemplate = require('../membershipRenewalEmailTemplate');

require('babel-polyfill');
var brandedQRCode = require('branded-qr-code');
let fs = require('fs');

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}


async function sendMail(user_id, status) {
  let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id });
  try {
    let emailTemplate = {};
    if(status === "create") {
      emailTemplate = {
        subject: 'Xzero Membership Purchased!',
        text: `Thank You for purchasing our membership`,
        html: membershipEmailTemplate,
      };
    } else {
      emailTemplate = {
        subject: 'Xzero Membership Renewed!',
        text: `Thank You for renewing our membership`,
        html: membershipRenewalEmailTemplate,
      };
      
    }
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
      var randomChars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var result = '';
      for (var i = 0; i < length; i++) {
        if ((i % 5 === 0) && (i != 0) && (i != length - 1))
          result += "-";
        else
          result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
      }
      return result;
    }


    async function generateSerial() {
      let serialnew = generateMemberId(16);
      let SerialExist = await strapi.query('membership').findOne({ serial: serialnew }); 
  
        if(SerialExist === null) {
          return serialnew;

        } else {
          //for testing
          if(serialnew === SerialExist.serial ) {
            serialnew = generateMemberId(16);
            return serialnew;
          }
          await generateSerial();
         
        } 
    }
    

    async function createQR(userinfo) {
      let filename = "qr_"+userinfo.userid+".png";
      let logo = "../../../public/qrcode/logo.png";

      let qrcode = await brandedQRCode.generate({text: userinfo.serial, path: logo, 
        opt: { color: {dark: '#F00', light : '#fff'}, errorCorrectionLevel: 'M' } })
        .then((buf) => {
          fs.writeFile("public/qrcode/"+filename, buf, (err) => {
            if (err) {
              throw err
            }
            
            return filename;
          });
        });

        return filename;

    }
    
    let checkUserExist = await strapi.query('membership').findOne({ user: user_id });
    if (checkUserExist === null) {
      let expiry_date = new Date();
      let serial = await generateSerial();
      var userinfo = {userid:user_id, serial : serial };
      let qrcodefile = await createQR(userinfo);
      let membership = await strapi.query('membership').create({ serial: serial, qrcode_url: qrcodefile,  user: user_id, expiry: expiry_date.addDays(365) });
      await strapi.query('membership-transactions').create({ membership_id: membership.id, serial: serial, type: 'New', expiry: expiry_date, amount });
      sendMail(user_id, "create");
      return membership;
    }
    else {
      let serial = await generateSerial();
      var userinfo = {userid:user_id, email :checkUserExist.user.email, serial : serial };
      let qrcodefile = await createQR(userinfo);
      
      await strapi.query('membership-transactions').create({ membership_id: checkUserExist.id, serial: serial, type: 'Renewal', expiry: checkUserExist.expiry, amount });
      let membership =  await strapi.query('membership').update({ user: user_id }, { serial: serial, qrcode_url: qrcodefile, expiry: new Date(checkUserExist.expiry).addDays(365) });
      sendMail(user_id, "renewal");
      return membership;
    } 
  },


};
