'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');
const registerEmailTemplate = require('../registerEmailTemplate');
const otpVerificationTemplate = require('../otpVerificationTemplate');
const otpConfirmationTemplate = require('../otpConfirmationTemplate');


const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {

  async SendSms(ctx) {
    
    const phoneRegExpINTL =  /^(\+?\d{1,4}[- ]?)?\d{12}$/;

    var sentStatus = false;
    let params = ctx.request.body;

    let user = params.user;
    let mobile = params.mobile;
    
    let lang = params.lang;

    
    let smsInfo = await strapi.query('sms').findOne({ status: true });
    
    // if(params.mobile) {
    //   let existingUser = await strapi.query('user', 'users-permissions').count({ mobile_number: params.mobile });
    //   if(existingUser > 0 ){
    //     return ctx.badRequest (
    //       null,
    //       formatError({
    //         id: 'otp.mobilenumber.exist',
    //         message: 'Mobile number is already choosen',
    //       })
    //     )
    //   }
    // }

    if(user === 0 || user === null) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'No record found',
        })
      ); 
    } else if(!String(mobile).match(phoneRegExpINTL)) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'Please enter country code, Ex - +971 if number in UAE',
        })
      ); 

    } 

    

    if (smsInfo.status == true) {

      let type = "";
      let msg = smsInfo.otp_msg_en;
      let unicode = false;
      let email = true;

      if (typeof params.email != 'undefined') {
        email = params.email;
      }

      if (lang === "ar") {
        type = "&type=unicode";
        msg = smsInfo.otp_msg_ar;
        unicode = true;
      }


      var otp = Math.floor(1000 + Math.random() * 9000);
      let sendMsg = msg ? msg : "Thank you for using xzero app";
      sendMsg = msg + otp;

      let dateTime = await strapi.services['app-basic-information'].CurrentDateTime();

      let updatedUser = await strapi.query('user', 'users-permissions').update({ id: user }, { otp: otp, otp_generated_at: dateTime });

      let balance = await strapi.services.sms.QueryBalance();

      if(updatedUser && balance > 0) {
        
        let sent  =  await strapi.services.sms.SendMessage(mobile, sendMsg, unicode);
        
        if(sent) {
          sentStatus = true;
          await strapi.query('sms').update({ id: smsInfo.id }, {
            total_sms_sent: parseInt(smsInfo.total_sms_sent)+1
          });
        } else {
          let updatedUser = await strapi.query('user', 'users-permissions').update({ id: user }, { otp: null, otp_generated_at: null });
        }

      } else {
        return ctx.badRequest(
          null,
          formatError({
            id: 'otp.authenticate',
            message: 'something went wrong, please try again later',
          })
        ); 
      }

      if (email === true) {
        try {
          let otpEmailTemplate = {};

          otpEmailTemplate = {
            subject: "Your OTP for Xzero App",
            text: `Thank You for using Xzero App`,
            html: otpVerificationTemplate,
          };

          // Send an email to the user.
          await strapi.plugins["email"].services.email.sendTemplatedEmail(
            {
              to: updatedUser.email,
              from: "support@xzero.app",
            },
            otpEmailTemplate,

            {
              otp: { otp: otp }
            }

          );
        } catch (err) {
          console.log(err);
        }
      }

      

      return ctx.send({
        otp: otp,
        msg: sendMsg,
        status: sentStatus,
        balance: balance
      });

    }

  },


  //function for verfiy otp
  async verifyOtp(ctx) {
    let params = ctx.request.body;

    let user = await strapi.query('user', 'users-permissions').findOne({ id: params.user });

    let smsInfo = await strapi.query('sms').findOne({ status: true });

    let status = false;

    if (smsInfo.status !== true) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'otp verification disabled',
        })
      );
    }


    var startDate = await strapi.services['app-basic-information'].CurrentDateTime(user.otp_generated_at);

    var endDate = await strapi.services['app-basic-information'].CurrentDateTime();

    var seconds = (endDate.getTime() - startDate.getTime());
    var Seconds_from_T1_to_T2 = seconds / 1000;
    var Seconds_Between_Dates = Math.floor(Seconds_from_T1_to_T2);

    if (user.otp === null) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'No otp found',
        })
      );
    } else if (Seconds_Between_Dates >= smsInfo.expiry_seconds) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'otp expired.',
        })
      );
    } else if (parseInt(user.otp) === params.otp) {
      var msg = "Verification successfull";
      await strapi.query('user', 'users-permissions').update({ id: params.user }, { confirmed: true });
      await strapi.query('user', 'users-permissions').update({ id: params.user }, { otp: null, otp_generated_at: null });
      status = true;

      // email will be send after confirmation
      //if (email === true) {
        try {
          let otpEmailTemplate = {};

          otpEmailTemplate = {
            subject: "Your Account has been verified",
            text: `Thank You for using Xzero App`,
            html: otpConfirmationTemplate,
          };

          // Send an email to the user.
          await strapi.plugins["email"].services.email.sendTemplatedEmail(
            {
              to: user.email,
              from: "support@xzero.app",
            },
            otpEmailTemplate,

            {
              otp: { otp: params.otp }
            }

          );
        } catch (err) {
          console.log(err);
        }
      //}

      //end of email code


    } else {

      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'otp is not valid.',
        })
      );
    }

    return ctx.send({ msg: msg, status: status });

  },

  async UpdateUserReferralCode(user = null) {

    let userRef = await strapi.query('user', 'users-permissions').find({ referral_code_ne: null || '' });
    
    if(user === null || user === 0) {
      var userAllwithNoRefercode = await strapi.query('user', 'users-permissions').find({ referral_code_eq: null });
    } else {
      var userAllwithNoRefercode = await strapi.query('user', 'users-permissions').find({ id: user, referral_code_eq: null });
    }
    
    let filterReferralCode = userRef.map(user => user.referral_code);
    
    if (userAllwithNoRefercode.length > 0) {
      userAllwithNoRefercode.forEach(user => {
        let referral_code = Math.random().toString(36).substr(2, 6);
        if (!filterReferralCode.includes(referral_code)) {
          var updatedUser = strapi.query('user', 'users-permissions').update({ id: user.id }, { referral_code: referral_code.toUpperCase() });
          //continue;
        } else {
          referral_code = Math.random().toString(36).substr(2, 6);
        }
      });
    } else {
      let result = "no users with empty referral code";
      return { result };
    }
    let result = "success";
    return { result }
  },



  async createNewUser(ctx, params) {
    
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore.get({
      key: 'advanced',
    });

    let createError = null;

    if (!settings.allow_register) {
      createError = new Error('Register action is currently disabled.');
      createError.code = 400;
      throw createError;
    }

    // Password is requ ired.
    if (!params.password) {
      createError = new Error('Please provide your password.');
      createError.code = 400;
      throw createError;
    }

    // Email is require d.
    if (!params.email) {
      createError = new Error('Please provide your email.');
      createError.code = 400;
      throw createError;
    }
    

     // birthday is required field validation.
     if (!params.birthday && typeof params.birthday === 'undefined') {
      createError = new Error('Birthday cannot be blank');
      createError.code = 400;
      throw createError;
    } else if(params.birthday) {
      let minimumAge = 10;
      let born = params.birthday;
      let now = new Date();
        var birthday = new Date(now.getFullYear(), born.getMonth(), born.getDate());
        if (now >= birthday) {
          var diff =  now.getFullYear() - born.getFullYear();
        } else {
          var diff = now.getFullYear() - born.getFullYear() - 1;
        }
        if(diff < 0) { 
          createError = new Error('Please check the date you entered');
          createError.code = 400;
          throw createError;
        } else if(diff < minimumAge) {
          createError = new Error('You need to be atleast '+minimumAge+' years old');
          createError.code = 400;
          throw createError;
        }
    }

    // Throw an error if the password selected by the user
    // contains more th an two times the symbol '$'.
    if (strapi.plugins['users-permissions'].services.user.isHashed(params.password)) {
      createError = new Error('Your password cannot contain more than three times the symbol `$`.');
      createError.code = 400;
      throw createError;
    }

    const role = await strapi
      .query('role', 'users-permissions')
      .findOne({ type: settings.default_role }, []);

    if (!role) {
      createError = new Error('Impossible to find the default role.');
      createError.code = 400;
      throw createError;
    }


    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    var ranges = [
      '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
      '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
      '\ud83d[\ude80-\udeff]',  // U+1F680 to U+1F6FF
    ];
      
    params.username = params.username.replace(new RegExp(ranges.join('|'), 'g'), '');

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      createError = new Error('Please provide valid email address.');
      createError.code = 400;
      throw createError;
    }

    params.role = role.id;
    params.password = await strapi.plugins['users-permissions'].services.user.hashPassword(params);

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email,
    });
    const userInfoMobile = await strapi.query('user', 'users-permissions').findOne({
      mobile_number: params.mobile_number,
    });



    //clear the non-user token upon being a user
    const nonuser = await strapi.query('non-users').findOne({
      device_id: params.device_id
    });    
    if(nonuser !== null) {
      await strapi.query('non-users').delete({
        id: nonuser.id
      });
    }


    if (user && user.provider === params.provider) {
      createError = new Error('Email is already taken.');
      createError.code = 400;
      throw createError;
    }
    
    if (userInfoMobile && userInfoMobile.mobile_number === params.mobile_number) {
      createError = new Error('Mobile number is already used.');
      createError.code = 400;
      throw createError;
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      createError = new Error('Email is already taken.');
      createError.code = 400;
      throw createError;
    }

    try {
      params.confirmed = false;
      params.provider = params.provider || 'local';

   
      //for adding referral code while adding a user via app
      var referral_code = Math.random().toString(36).substr(2, 6);
      const userRef = await strapi.query('user', 'users-permissions').findOne({
        referral_code: referral_code
      });
      params.referral_code = userRef ? Math.random().toString(36).substr(2, 6).toUpperCase() : referral_code.toUpperCase();
      //code referral ends

      const user = await strapi.query('user', 'users-permissions').create(params);

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue(
        _.pick(user.toJSON ? user.toJSON() : user, ['id'])
      );

      const sanitizedUser = sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query('user', 'users-permissions').model,
      });

      try {
        const emailTemplate = {
          subject: 'Thank You for registering to Xzero App - <%= user.firstname %>!',
          text: `Thank You for registering to Xzero App`,
          html: registerEmailTemplate,
        };
        // Send an email to the user.
        await strapi.plugins['email'].services.email.sendTemplatedEmail(
          {
            to: (user.toJSON ? user.toJSON() : user).email,
            from: "admin@xzero.app",
          },
          emailTemplate,
          {
            user: { firstname: (user.toJSON ? user.toJSON() : user).username }
          }
        );
        await strapi.plugins['email'].services.email.send(
          {
            to: 'user@xzero.app',
            from: "admin@xzero.app",
            subject: 'New User Registration - ' + user.username,
            text: `New user registered to Xzero App. User Information \n Name: ${user.username} \n Email: ${user.email}`,
          },
        );
      } catch (err) {
        console.log(err);
        return ctx.badRequest(null, err);
      }

      return {
        jwt,
        user: sanitizedUser,
      };

    } catch (err) {
      if (_.includes(err.message, 'email')) {
        createError = new Error('Email is already taken.');
        createError.code = 400;
        throw createError;
      }
    }
  },


  async updateUserData(ctx) 
  {
    let params = ctx.request.body;

    
    if(params.data.birthday) {
      let minimumAge = 10;
      let born = params.data.birthday;
      let now = new Date();
        var birthday = new Date(now.getFullYear(), born.getMonth(), born.getDate());
        if (now >= birthday) {
          var diff =  now.getFullYear() - born.getFullYear();
        } else {
          var diff= now.getFullYear() - born.getFullYear() - 1;
        }
        if(diff < 0) { 
          return ctx.badRequest(
            null,
            formatError({
              id: 'Profile.form.error.birthday.provide',
              message: 'Please check the date you entered',
            })
          );
        } else if(diff < minimumAge) {
          return ctx.badRequest(
                null,
                formatError({
                  id: 'Profile.form.error.birthday.provide',
                  message: 'You need to be atleast '+minimumAge+' years old',
                })
              );
        }
    }
   
    let updatedOne = await strapi.query('user', 'users-permissions').update({ id: params.where.id }, { ...params.data });
    
    return ctx.send({user: updatedOne});
  
  },

  async userLogin(ctx) {

    const params = ctx.request.body;

    const store = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });


    // The password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.provide',
          message: 'Please provide your password.',
        })
      );
    }

    const query = {};

    // Check if the provided identifier is an email or not.
    const isEmail = emailRegExp.test(params.identifier);

    // Set the identifier to the appropriate query field.
    if (isEmail) {
      query.email = params.identifier.toLowerCase();
    } else {
      query.username = params.identifier;
    }

    // Check if the user exists.
    const user = await strapi.query('user', 'users-permissions').findOne(query);

    if (!user) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.invalid',
          message: 'Identifier or password invalid.',
        })
      );
    }

   

    if (user.blocked === true) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.blocked',
          message: 'Your account has been blocked by an administrator',
        })
      );
    }

    const validPassword = await strapi.plugins[
      'users-permissions'
    ].services.user.validatePassword(params.password, user.password);

    if (!validPassword) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.invalid',
          message: 'Email or password invalid!',
        })
      );
    } else {

      await strapi.query('user', 'users-permissions').update({ id: user.id }, { app_version: params.app_version, platform: params.platform, device_id: params.device_id });
      
      ctx.send({
        jwt: strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    }
  },
};
