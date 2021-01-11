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

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

async function ApplyCode(receiver, price, code, plan) {
  let userExistCount = await strapi.query("user", "users-permissions").count({ id: receiver });
  if(code === null) {
    return { applied: false, msg: "No code used" };
  } else if(userExistCount === 0) {
    return { applied: false, msg: "User Doesn't exist" };
  }
  let referralCode = sanitizeEntity(code, 'string');
  let userCode = await strapi.query('user', 'users-permissions').findOne({ referral_code: referralCode, enable_refer_and_earn: true });
  let promocode = await strapi.query("promocode").findOne({ promocode: referralCode, status: true });
  let affiliate = await strapi.query("affiliate").findOne({ referral_code: referralCode, status: true });

  let referProgram = await strapi.query("referral-program").findOne({ status: true });    
  
  if( referProgram !== null && userCode!==null && userCode.referral_code !== null && userCode.id !== parseInt(receiver)) {
      let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
      let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, from: 'referral' , status: true });
      if(userUsedHistory < referProgram.usage_limit && (usedHistory < referProgram.user_can_refer || referProgram.user_can_refer === null )) {
          //receiver get
          let discountAmount = (parseFloat(referProgram.discount)/100) * parseFloat(price);
          if(referProgram.allowed_maximum_discount !== null) {
            discountAmount = (discountAmount <= referProgram.allowed_maximum_discount) ? discountAmount: referProgram.allowed_maximum_discount; 
          }
          
          let afterDiscount = parseFloat(price) - parseFloat(discountAmount.toFixed(2));
          //sender will get
          let referrerCredit = (parseFloat(referProgram.referrer_get)/100) * parseFloat(price);  
          referrerCredit = (referrerCredit <= referProgram.referrer_allowed_maximum_amount) ? referrerCredit: referProgram.referrer_allowed_maximum_amount;

          return { discount: referProgram.discount.toFixed(2), discountYouGet: discountAmount.toFixed(2),  discountedPrice: afterDiscount.toFixed(2), applied: true, userId: userCode.id, from: 'referral', codeApplied: referralCode, referrerCredit: referrerCredit.toFixed(2) };
          
      } else {
        
        if( referProgram.user_can_refer <= 0 || referProgram.usage_limit <= 0 ) {
          var msg = "User can refer or usage limit is set 0";
        } else {
          var msg = "Invalid referral code";
        }
        return { applied:false, msg: msg, from: 'referral', codeApplied: referralCode };
      }

  } else if( affiliate !== null && (affiliate.applied_for === "membership" || affiliate.applied_for === 'both' ) && affiliate.user.id !== parseInt(receiver)) {

    let affiliateAllowedPlan = affiliate.membership_plans.map((membershipPlan) => membershipPlan.id); 
  
    if(affiliateAllowedPlan.includes(plan) ) {
      var support = true
    } else if( affiliateAllowedPlan.length === 0 ) {
      var support = true;
    } else {
      var support = false;
    }

    if(support ===  true) {

    if(affiliate.type === "limited") {

      let limtedUsers = affiliate.users_for_limited_types.map((affiliateLimited) => affiliateLimited.id);
    
      if(limtedUsers.includes(parseInt(receiver))) {

        let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
        let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
      
          if( userUsedHistory < affiliate.allowed_usage_per_user && usedHistory < affiliate.limit ) {
            let discountAmount = (parseFloat(affiliate.discount)/parseFloat(100)) * parseFloat(price);
            if(affiliate.maximum_allowed_discount !== null) {
              discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
            }
            
            let discountedPrice = parseFloat(price) - parseFloat(discountAmount.toFixed(2));

            if(affiliate.fixed_amount_status === true ) {
              var affiliateCredit = affiliate.fixed_amount;
            } else {
              var affiliateCredit =  (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount;
            }

            return {referrerCredit: affiliateCredit.toFixed(2), applicableFor: affiliate.applied_for, affiliateId: affiliate.id, userId: affiliate.user.id, discount: affiliate.discount.toFixed(2), from: 'affiliate', discountedPrice: discountedPrice.toFixed(2), discountYouGet: discountAmount.toFixed(2), applied: true, CodeApplied :referralCode }

          } else {
            if(affiliate.limit <= 0 || affiliate.allowed_usage_per_user <= 0) {
              var msg = "Affiliate limit or user limit is set 0";
            } else if(userUsedHistory >= affiliate.allowed_usage_per_user) {
              var msg = "Affiliate user limit exceeded";
            } else if(usedHistory >= affiliate.limit) {
              var msg = "Affiliate maximum limit exceeded, try again later";
            } else {
              var msg = "Affiliate maximum limit exceeded, try again later";
            }
            return { applied: false, codeApplied: referralCode , msg: msg }
          }  
        } else {
          return { applied: false, codeApplied: referralCode , msg: "Affiliate type is limited, please check the user privilege" }
        }

      } else {
        let usedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, status: true });
        let userUsedHistory = await strapi.query("referral-code-transaction").count({ referral_code: referralCode, user: receiver, status: true });
      
          if( userUsedHistory < affiliate.allowed_usage_per_user && usedHistory < affiliate.limit ) {
            let discountAmount = (parseFloat(affiliate.discount)/parseFloat(100)) * parseFloat(price);
            if(affiliate.maximum_allowed_discount !== null) {
              discountAmount = (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount; 
            }
            let discountedPrice = parseFloat(price) - parseFloat(discountAmount.toFixed(2));

            if(affiliate.fixed_amount_status === true ) {
              var affiliateCredit = affiliate.fixed_amount;
            } else {
              var affiliateCredit =  (discountAmount <= affiliate.maximum_allowed_discount) ? discountAmount: affiliate.maximum_allowed_discount;
            }

            return { referrerCredit: affiliateCredit.toFixed(2), applicableFor: affiliate.applied_for, affiliateId: affiliate.id, userId: affiliate.user.id, discount: affiliate.discount.toFixed(2), from: 'affiliate', discountedPrice: discountedPrice.toFixed(2), discountYouGet: discountAmount.toFixed(2), applied: true, CodeApplied :referralCode }
          } else {
            if(affiliate.limit <= 0 || affiliate.allowed_usage_per_user <= 0) {
              var msg = "Affiliate limit or user limit is set 0";
            } else if(userUsedHistory >= affiliate.allowed_usage_per_user) {
              var msg = "Affiliate user limit exceeded";
            } else if(usedHistory >= affiliate.limit) {
              var msg = "Affiliate maximum limit exceeded, try again later";
            } else {
              var msg = "Maximum limit for affiliate has reached";
            }
            return { applied: false, codeApplied: referralCode , msg: msg }
          }  
        } 
      } else {
        return { applied: false, codeApplied: referralCode , msg: "Affiliate code can be used for only specific membership plan" }
      }
     
    } else if( promocode !== null && (promocode.applied_for === "membership" || promocode.applied_for === 'both')) {
      let getPromoCodeUsedCountByAllUsers = await strapi.query("promocode-transaction").count({ promocode: referralCode, status: true });
      let getPromoCodeUsedCountByUser = await strapi.query("promocode-transaction").count({ promocode: referralCode, user: receiver, status: true });
      
      let start_date = promocode.start_date ? promocode.start_date: new Date();
      let end_date = promocode.start_date ? promocode.end_date: new Date();

        if(new Date().toString() >= start_date && end_date >= start_date || (promocode.start_date ===null || promocode.end_date === null) )  {
          if( getPromoCodeUsedCountByUser < promocode.maximum_usage_per_user && getPromoCodeUsedCountByAllUsers < promocode.limit ) {
            let discountAmount = (parseFloat(promocode.discount)/parseFloat(100)) * parseFloat(price);
            if(promocode.allowed_maximum_discount !== null) {
              discountAmount = (discountAmount <= promocode.allowed_maximum_discount) ? discountAmount: promocode.allowed_maximum_discount; 
            } 
            
            let discountedPrice = parseFloat(price) - parseFloat(discountAmount.toFixed(2));
            
            return { discount: promocode.discount.toFixed(2), discountedPrice: discountedPrice.toFixed(2), promocodeId: promocode.id, from: 'promocode', discountYouGet: discountAmount.toFixed(2), applied: true, CodeAapplied: referralCode }
          } else {
            if(promocode.limit <= 0 || promocode.maximum_usage_per_user <= 0 ) {
              var msg = "Promocode limit or user limit is set to 0";
            } else if(getPromoCodeUsedCountByUser>=promocode.maximum_usage_per_user) {
              var msg = "Promocode user limit exceeded";
            } else if(getPromoCodeUsedCountByAllUsers>=promocode.limit) {
              var msg = "Promocode maximum limit exceeded, try again later";
            } else {
              var msg = "Promocode maximum limit exceeded, try again later";
            }
            return { applied: false, codeApplied: referralCode, msg: msg }
          } 
        } else {
          return {  applied: false, codeApplied: referralCode, msg: "Promocode expired" }
        } 
    
    } else {
      var msg = "Invalid Code";
      if((affiliate !== null && affiliate.user.id == parseInt(receiver)) || (userCode !== null && userCode.id === parseInt(receiver) )) {
        var msg = "Referrer and receiver can't be same";
      }
      return {  applied: false, codeApplied: referralCode, msg: msg }
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

//Generate the QRCode image
async function createQRForExisting(userInfo) {
  
  let fileName = "/qrcode/qr_" + userInfo.user.id + ".png";
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
  


module.exports = {

//Generate the QRCode image
async QRforExistingUser(reset = false) {
  if(reset === true) {
    var membershipWithNoQRcode = await strapi.query('membership').find({ qrcode_url_ne: null });
  } else {
    var membershipWithNoQRcode = await strapi.query('membership').find({ qrcode_url_null: true });
  }
  if (membershipWithNoQRcode.length > 0) {
  await Promise.all(membershipWithNoQRcode.map(async (member) => {
    if(member.user) {
      var qr = await createQRForExisting(member);
      await strapi.query('membership').update({ id: member.id }, { qrcode_url: qr });
    } else {
      var qr = null;
    } 
    }));
    
    } else {
      let result = "no users with empty referral code";
      return { result };
    }
    let result = "success";
  return { result }
},



  async generateMembership(ctx) {
    //new code
    const params = ctx.request.body;
    
    let user_id = params.user_id;
    let plan = params.plan;
    if(params.code) {
      var code = params.code;
    } else {
      var code = null;
    }


    //ends
  
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
    if (packageSelected !== null && checkUserExist !== null && packageSelected.limit !== null) {
      offerLimit = packageSelected.limit;
      totalOfferLimit = parseInt(offerLimit) + parseInt(checkUserExist.limit);
    } else if(packageSelected !== null && checkUserExist !== null) {
      offerLimit = process.env.membershipPlanOfferLimit ? process.env.membershipPlanOfferLimit: 2000;
      totalOfferLimit = parseInt(offerLimit) + parseInt(checkUserExist.limit);
    }

    let afterCodeApply = await ApplyCode(user_id, packageSelected.price, code, plan);

    if( code!==null && afterCodeApply !== null && afterCodeApply.applied === false ) {
      
      return ctx.send ({
        codeStatus: afterCodeApply.msg
      });


    }
    
    
    if (checkUserExist === null) {
      
      let serial = await generateSerial();

      if(typeof params.type !== 'undefined' && params.type === 'manual') {
        var paidAmount = 0;
        var remarks = "Added from strapi manually";
        serial = params.serial.toUpperCase();
      } else if(code === null) {
        var paidAmount = packageSelected.price;
      } else {
        var paidAmount = afterCodeApply.discountedPrice ? afterCodeApply.discountedPrice: 0;
      }

      
      let expiryDate = new Date(new Date().setMonth(new Date().getMonth() + packageSelected.duration));
      
      
      
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
          expiry: expiryDate,
          remarks: remarks ? remarks:null
        });

        

      await strapi
        .query("membership-transactions")
        .create({
          membership_id: membership.id,
          serial: serial,
          type: process.env.membershipNew ? process.env.membershipNew: "New",
          expiry: expiryDate,
          amount: packageSelected.price,
          promocode_applied: afterCodeApply.applied === true ? code: null,
          discount: afterCodeApply.discount ? afterCodeApply.discount: null,
          paid_amount: paidAmount
        });

        //updating the promocode transaction table
        if(afterCodeApply !== null && afterCodeApply.applied === true) {
          var msg = "Success";
          if(afterCodeApply.from === "promocode")  {
          let promocodeTransactions = { promocode: code,
            user: user_id,
            paid_amount: afterCodeApply.discountedPrice,
            discount: afterCodeApply.discount,
            applied_for: 'membership',
            cost:  packageSelected.price,
            inserted_id: membership.id,
            status: true
           }
          let promoTransact =  await strapi
            .query("promocode-transaction")
            .create(promocodeTransactions);

            if(promoTransact!==null &&  afterCodeApply.from === "promocode" && afterCodeApply.promocodeId !== null) {
              let promocodeData = await strapi.query("promocode").findOne({ id: afterCodeApply.promocodeId });
              let totalUsage = promocodeData.total_usage ? promocodeData.total_usage: 0;
              await strapi.query("promocode").update({ id: afterCodeApply.promocodeId },
                {
                  total_usage: parseInt(totalUsage)+1 
                }
              );
            }
          } else {
            let referralTransactions = { referral_code: code,
              user: user_id,
              paid_amount: afterCodeApply.discountedPrice,
              discount: afterCodeApply.discount,
              applied_for: 'membership',
              cost:  packageSelected.price,
              affiliate: afterCodeApply.affiliateId ?  afterCodeApply.affiliateId: null,
              membership: membership.id,
              from: afterCodeApply.from,
              referrer: afterCodeApply.userId ? afterCodeApply.userId: null,
              referrer_credit: afterCodeApply.referrerCredit ? afterCodeApply.referrerCredit: null,
              inserted_id: membership ? membership.id:null,
              status: true
             }

             let referralTransact =  await strapi
              .query("referral-code-transaction")
              .create(referralTransactions);

               //update the total usage count in affiliate
               if( referralTransact !=null && afterCodeApply.from === "affiliate" && afterCodeApply.affiliateId !== null ) {
                let affiliateData = await strapi.query("affiliate").findOne({ id: afterCodeApply.affiliateId });
                let totalUsage = affiliateData.total_usage ? affiliateData.total_usage: 0;
                await strapi.query("affiliate").update({ id: afterCodeApply.affiliateId },
                  {
                    total_usage: (totalUsage)+1 
                  }
                );
              } else if( referralTransact && afterCodeApply.from === "referral" ) {
                let userReferLogExist = await strapi.query("user-referral-log").findOne({ user: afterCodeApply.userId });
                if(!userReferLogExist) {
                  let count = 0;
                  await strapi.query("user-referral-log").create(
                    {
                      user: afterCodeApply.userId,
                      count: parseInt(count) + 1 
                    }
                  );
                } else {
                  await strapi.query("user-referral-log").update( {user: userCode.id,}, 
                    {
                      count: parseInt(userReferLogExist.count) + 1 
                    }
                  ); 
                }
              }

           }
        } else {
          var msg = afterCodeApply.msg;
        
        }
    
      sendMail(user_id, "create");
      return ctx.send ({
        membership: membership, 
        codeStatus: msg
      });
      
      

    } else {

      let serial = await generateSerial();

      if(typeof params.type !== 'undefined' && params.type === 'manual') {
        var paidAmount = 0;
        var remarks = "Added from strapi manually";
        serial = params.serial.toUpperCase();
      } else if(code === null) {
        var paidAmount = packageSelected.price;
      } else {
        var paidAmount = afterCodeApply.discountedPrice ? afterCodeApply.discountedPrice: 0;
      }

      var userInfo = { userid: user_id, serial: serial };;
      let qrCodeFile = await createQR(userInfo);

      if(checkUserExist !==null && checkUserExist.expiry !== null) {
        var expiryDate = new Date(new Date(checkUserExist.expiry).setMonth(new Date(checkUserExist.expiry).getMonth()+packageSelected.duration));
      } else {
        var expiryDate = new Date(new Date().setMonth(new Date().getMonth() + packageSelected.duration));
      }
      
      
      await strapi
        .query("membership-transactions")
        .create({
          membership_id: checkUserExist.id,
          serial: serial,
          type: process.env.membershipRenewal ? process.env.membershipRenewal: "Renewal",
          expiry: expiryDate,
          amount: packageSelected.price,
          promocode_applied: afterCodeApply.applied === true ? code: null,
          discount: afterCodeApply.discount ? afterCodeApply.discount: null,
          paid_amount: paidAmount
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
            expiry: expiryDate,
            remarks: remarks ? remarks:null

          }
        );

        if(afterCodeApply !== null && afterCodeApply.applied === true) {
          var msg = "Success";
          if(afterCodeApply.from === "promocode") {

          let promoTransact =await strapi
          .query("promocode-transaction")
          .create({ promocode: code,
            user: user_id,
            paid_amount: afterCodeApply.discountedPrice,
            discount: afterCodeApply.discount,
            applied_for: 'membership',
            cost:  packageSelected.price,
            inserted_id: membership.id,
            status: true
          });


          
          if(promoTransact!==null &&  afterCodeApply.from === "promocode" && afterCodeApply.promocodeId !== null) {
            let promocodeData = await strapi.query("promocode").findOne({ id: afterCodeApply.promocodeId });
            let totalUsage = promocodeData.total_usage ? promocodeData.total_usage: 0;
            await strapi.query("promocode").update({ id: afterCodeApply.promocodeId },
              {
                total_usage: parseInt(totalUsage)+1 
              }
            );
          }

        }  else {
          
          let referralTransactions = { referral_code: code,
            user: user_id,
            paid_amount: afterCodeApply.discountedPrice,
            discount: afterCodeApply.discount,
            applied_for: 'membership',
            cost:  packageSelected.price,
            affiliate: afterCodeApply.affiliateId ?  afterCodeApply.affiliateId: null,
            membership: membership.id,
            from: afterCodeApply.from,
            referrer: afterCodeApply.userId ? afterCodeApply.userId: null,
            referrer_credit: afterCodeApply.referrerCredit ? afterCodeApply.referrerCredit: null,
            inserted_id: membership ? membership.id:null,
            status: true
           }
           
          let referralTransact = await strapi
            .query("referral-code-transaction")
            .create(referralTransactions);

               //update the total usage count in affiliate
               if( referralTransact !=null && afterCodeApply.from === "affiliate" && afterCodeApply.affiliateId !== null ) {
                let affiliateData = await strapi.query("affiliate").findOne({ id: afterCodeApply.affiliateId });
                let totalUsage = affiliateData.total_usage ? affiliateData.total_usage: 0;
                await strapi.query("affiliate").update({ id: afterCodeApply.affiliateId },
                  {
                    total_usage: parseInt(totalUsage) + 1 
                  }
                );
              } else if( referralTransact && afterCodeApply.from === "referral" ) {
                let userReferLogExist = await strapi.query("user-referral-log").findOne({ user: afterCodeApply.userId });
                if(!userReferLogExist) {
                  let count = 0;
                  await strapi.query("user-referral-log").create(
                    {
                      user: afterCodeApply.userId,
                      count: parseInt(count) + 1 
                    }
                  );
                } else {
                  await strapi.query("user-referral-log").update( {user: afterCodeApply.userId}, 
                    {
                      count: parseInt(userReferLogExist.count) + 1 
                    }
                  ); 
                }
              }


        }
      } else {
        var msg = afterCodeApply.msg;
      }
      sendMail(user_id, "renewal");

      return ctx.send ({
        membership: membership, 
        codeStatus: msg
      });

      
    }
  },

  
  async getMembershipExpiryDays(user_id) {
    let membership = await strapi.query("membership").findOne({ user: user_id });
    let dt = new Date();
    let localTime = dt.getTime(); 
    let localOffset = dt.getTimezoneOffset(); 
    let utc = localTime + localOffset;
    let offset = 4; // GST (Gulf Standard Time) ahead +4 hours from utc
    let currentDateTime = utc + (3600000*offset); 
    let current = new Date(currentDateTime); 
    const date2 = new Date(membership.expiry);
    const diffTime = Math.abs(date2 - current);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if(date2 < current && diffDays > 1) {
      return { diffDays: -1}   
    }
    return { diffDays }
  }


};
