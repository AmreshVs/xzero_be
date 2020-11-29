"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

require("babel-polyfill");
var brandedQRCode = require("branded-qr-code");
let fs = require("fs");
const { sanitizeEntity } = require('strapi-utils');


const membershipEmailTemplate = require("../membershipEmailTemplate");
const membershipRenewalEmailTemplate = require("../membershipRenewalEmailTemplate");

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};


async function ApplyPromocode(user, price, promocode) {
  const promoCode = sanitizeEntity(promocode, 'string');
  let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: promoCode, status: true });
  let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: promoCode, user: user, status: true });
  let getPromoCode = await strapi.query("promocode").findOne({ promocode: promoCode, status: true });

  if(getPromoCode!==null) {
    if(getPromoCode.applied_for === "membership" || getPromoCode.applied_for ===null ) {

    let start_date = getPromoCode.start_date ? getPromoCode.start_date: new Date();
    let end_date = getPromoCode.start_date ? getPromoCode.end_date: new Date();
    if(new Date().toString() >= start_date && end_date >= start_date && getPromoCode!==null || (getPromoCode.start_date ===null || getPromoCode.end_date === null) )  {
      if( getPromoCodeUsedCountByUser<=getPromoCode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers <= getPromoCode.limit ) {
        let discountAmount = (parseInt(getPromoCode.discount)/parseInt(100)) * parseInt(price);
        discountAmount = (discountAmount <= getPromoCode.allowed_maximum_discount) ? discountAmount: getPromoCode.allowed_maximum_discount; 
        let discountedPrice = parseInt(price) - parseInt(Math.floor(discountAmount));
        return { discount: getPromoCode.discount, discountedPrice: discountedPrice, discountYouGet: Math.floor(discountAmount), applied: true, promoCodeAapplied:promocode }
      } else {
        if(getPromoCodeUsedCountByUser>getPromoCode.maximum_usage_per_user) {
          var msg = "User limit exceeded";
        } else {
          var msg = "Maximum limit exceeded, try again later";
        }
        return { applied: false, promoCodeApplied: msg }
      } 
    } else {
      return {  applied: false, promoCodeApplied: "Promocode expired", discountedPrice :price  }
    } 
  } else {
    return {  applied: false, promoCodeApplied: "Promocode cannot be used", discountedPrice :price  }
  }
  } else {
    return {  applied: false, promoCodeApplied: "Promocode is not supported"  }
  }
}


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
  async generateMembership(user_id, plan, promocode) {
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
    
    let promoCodeDetails = await ApplyPromocode(user_id, packageSelected.price, promocode);
  

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
          promocode_applied: promocode ? promocode: null,
          discount: promoCodeDetails.discount ? promoCodeDetails.discount: null,
          paid_amount: promoCodeDetails.discountedPrice ? promoCodeDetails.discountedPrice: null
        });

        //updating the promocode transaction table
        if(promoCodeDetails !== null && promoCodeDetails.applied === true) {
          var promocodeTransactions = { promocode: promocode,
            user: user_id,
            paid_amount: promoCodeDetails.discountedPrice,
            discount: promoCodeDetails.discount,
            applied_for: 'membership',
            cost:  packageSelected.price,
            status: true
           }
            await strapi
            .query("promocode-transaction")
            .create(promocodeTransactions);
        } 

       
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
          promocode_applied: promocode ? promocode: null,
          discount: promoCodeDetails.discount ? promoCodeDetails.discount: null,
          paid_amount: promoCodeDetails.discountedPrice ? promoCodeDetails.discountedPrice: null
        });
        //updating the promocode transaction table
        

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

        if(promoCodeDetails !== null && promoCodeDetails.applied === true) {
          await strapi
          .query("promocode-transaction")
          .create({ promocode: promocode,
            user: user_id,
            paid_amount: promoCodeDetails.discountedPrice,
            discount: promoCodeDetails.discount,
            applied_for: 'membership',
            cost:  packageSelected.price,
            status: true
          });
      } 
      //sendMail(user_id, "renewal");
      return membership;
    }
  },
};
