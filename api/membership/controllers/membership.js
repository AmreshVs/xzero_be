"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

require("babel-polyfill");
var brandedQRCode = require("branded-qr-code");
let fs = require("fs");

const membershipEmailTemplate = require("../membershipEmailTemplate");
const membershipRenewalEmailTemplate = require("../membershipRenewalEmailTemplate");

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

async function sendMail(user_id, status) {
  let user = await strapi
    .query("user", "users-permissions")
    .findOne({ id: user_id });
  try {
    let emailTemplate = {};
    if (status === "create") {
      emailTemplate = {
        subject: "Xzero Membership Purchased!",
        text: `Thank You for purchasing our membership`,
        html: membershipEmailTemplate,
      };
    } else {
      emailTemplate = {
        subject: "Xzero Membership Renewed!",
        text: `Thank You for renewing our membership`,
        html: membershipRenewalEmailTemplate,
      };
    }
    // Send an email to the user.
    await strapi.plugins["email"].services.email.sendTemplatedEmail(
      {
        to: user.email,
        from: "support@xzero.app",
      },
      emailTemplate
    );
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  async generateMembership(user_id, plan) {
    function generateMemberId(length) {
      var randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      var result = "";
      for (var i = 0; i < length; i++) {
        if (i % 5 === 0 && i != 0 && i != length - 1) result += "-";
        else
          result += randomChars.charAt(
            Math.floor(Math.random() * randomChars.length)
          );
      }
      return result;
    }

    //Generate the serialhash
    async function generateSerial() {
      let serialnew = generateMemberId(16);
      let SerialExist = await strapi
        .query("membership")
        .findOne({ serial: serialnew });

      if (SerialExist === null) {
        return serialnew;
      } else {
        await generateSerial();
      }
    }

    //Generate the QRCode image 
    async function createQR(userInfo) {
      let fileName = "/qrcode/qr_" + userInfo.userid + ".png";
      let logo = "../../../public/qrcode/logo.png";
      let serial = JSON.stringify({ serial: userInfo.serial });
      await brandedQRCode
        .generate({
          text: serial,
          path: logo,
          ratio: 6,
          opt: {
            color: { dark: "#000", light: "#fff" },
            width: 200,
            errorCorrectionLevel: "H",
          },
        })
        .then((buf) => {
          fs.writeFile("public" + fileName, buf, (err) => {
            if (err) {
              throw err;
            }
          });
        });

      return fileName;
    }

    let offerLimit = 0;
    let totalOfferLimit = 0;
    let checkUserExist = await strapi
      .query("membership")
      .findOne({ user: user_id });
    let packageSelected = await strapi
      .query("membership-plans")
      .findOne({ id: plan });

    // updating the limit upon renewal
    if (packageSelected !== null && checkUserExist !== null) {
      offerLimit = packageSelected.limit;
      totalOfferLimit = parseInt(packageSelected.limit) + parseInt(checkUserExist.limit);
    }
    
    if (checkUserExist === null) {
      let expiryDate = new Date();
      let serial = await generateSerial();
      var userInfo = { userid: user_id, serial: serial };
      let qrCodeFile = await createQR(userInfo);
      let membership = await strapi
        .query("membership")
        .create({
          serial: serial,
          qrcode_url: qrCodeFile,
          user: user_id,
          package: plan,
          limit: offerLimit,
          expiry: expiryDate.addDays(365),
        });
      await strapi
        .query("membership-transactions")
        .create({
          membership_id: membership.id,
          serial: serial,
          type: "New",
          expiry: expiryDate,
          amount: packageSelected.price,
        });
      //sendMail(user_id, "create");
      return membership;
    } else {
      let serial = await generateSerial();
      var userInfo = { userid: user_id, serial: serial };;
      let qrCodeFile = await createQR(userInfo);

      await strapi
        .query("membership-transactions")
        .create({
          membership_id: checkUserExist.id,
          serial: serial,
          type: "Renewal",
          expiry: checkUserExist.expiry,
          amount: packageSelected.price,
        });
      let membership = await strapi
        .query("membership")
        .update(
          { user: user_id },
          {
            serial: serial,
            qrcode_url: qrCodeFile,
            package: plan,
            limit: totalOfferLimit,
            expiry: new Date(checkUserExist.expiry).addDays(365),
          }
        );
      //sendMail(user_id, "renewal");
      return membership;
    }
  },
};
