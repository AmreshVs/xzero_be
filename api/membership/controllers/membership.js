'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

require('babel-polyfill');
var brandedQRCode = require('branded-qr-code');
let fs = require('fs');


const membershipEmailTemplate = require('../membershipEmailTemplate');
const membershipRenewalEmailTemplate = require('../membershipRenewalEmailTemplate');

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
  async generateMembership(user_id, amount, plan) {
    
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

      let serial = JSON.stringify({serial:userinfo.serial})
      await brandedQRCode.generate({text: serial, path: logo, ratio: 6,
        opt: { color: {dark: '#000', light : '#fff'}, width : 200,  errorCorrectionLevel: 'H'} })
        .then((buf) => {
          fs.writeFile("public/qrcode/"+filename, buf, (err) => {
            if (err) {
              throw err
            }
          });
        });

      return filename;
    }
    

    let offer_limit = 0;
    let total_offer_limit = 0;
    let checkUserExist = await strapi.query('membership').findOne({ user: user_id });
    let packageSelected = await strapi.query('membership-plans').findOne({ id: plan });

    // updating the limit upon renewal
    if(packageSelected !== null) {
      offer_limit = packageSelected.limit;
      total_offer_limit = parseInt(packageSelected.limit + checkUserExist.limit);
    } 
    
    
    if (checkUserExist === null) {
      let expiry_date = new Date();
      let serial = await generateSerial();
      var userinfo = { userid: user_id, serial: serial };
      let qrcodefile = await createQR(userinfo);
      let membership = await strapi.query('membership').create({ serial: serial, qrcode_url: qrcodefile,  user: user_id, package:plan, limit:offer_limit, expiry: expiry_date.addDays(365) });
      await strapi.query('membership-transactions').create({ membership_id: membership.id, serial: serial, type: 'New', expiry: expiry_date, amount });
      //sendMail(user_id, "create");
      return membership;
    }
    else {
      let serial = await generateSerial();
      var userinfo = {userid:user_id, email :checkUserExist.user.email, serial : serial };
      let qrcodefile = await createQR(userinfo);
      //console.log(qrcodefile); return false;
      await strapi.query('membership-transactions').create({ membership_id: checkUserExist.id, serial: serial, type: 'Renewal',  expiry: checkUserExist.expiry, amount });
      let membership =  await strapi.query('membership').update({ user: user_id }, { serial: serial, qrcode_url: qrcodefile, package:plan, limit:total_offer_limit, expiry: new Date(checkUserExist.expiry).addDays(365) });
      //sendMail(user_id, "renewal");
      return membership;
    } 
  },


};
