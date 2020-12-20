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


const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {

  async SendSms(ctx) {  
    var sentStatus = false;
    let params = ctx.request.body;
    
    let user = params.user;
    let mobile = params.mobile;
    let lang = params.lang;
    
    let smsInfo = await strapi.query('sms').findOne({ status : true });
    if(smsInfo.status == true) {
    
    let type = "";
    let msg = smsInfo.otp_msg_en;
    let unicode = false; 
    let email = true;

    if(typeof params.email != 'undefined') {
      email = params.email;
    }
    
    if(lang === "ar" ) {
      type = "&type=unicode";
      msg = smsInfo.otp_msg_ar;
      unicode = true;
    }


    var otp = Math.floor(1000 + Math.random() * 9000);
    let sendMsg = msg ? msg: "Thank you for using xzero app";
    sendMsg = msg+otp;
    
    let dateTime = await strapi.services['app-basic-information'].CurrentDateTime();
    
    let updatedUser =  await strapi.query('user', 'users-permissions').update({ id: user }, { otp: otp,  otp_generated_at: dateTime });

    let balance =  await strapi.services.sms.QueryBalance();

    // if(updatedUser && balance > 0) {
    //   let sent  =  await strapi.services.sms.SendMessage(mobile, sendMsg, unicode);
    //   console.log(sent);
    //   if(sent) {
    //     sentStatus = true;
    //   }
          
    // } else {
    //   return ctx.badRequest(
    //     null,
    //     formatError({
    //       id: 'otp.authenticate',
    //       message: 'something went wrong, please try again later',
    //     })
    //   ); 
    // }
    

    if(email === true) {
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
            to: "noufal@xzero.app",
            from: "support@xzero.app",
          },
          otpEmailTemplate,

          {
            otp: { otp: 1223 }
          }

        );
      } catch (err) {
        console.log(err);
      }
    }

    //console.log(sendMsg); return false;

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
    
    let user = await strapi.query('user', 'users-permissions').findOne({id: params.user});

    let smsInfo = await strapi.query('sms').findOne({ status: true});
    
    let status = false;

    if(smsInfo.status !== true) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'otp verification disabled',
        })
      ); 
    }
    

    var startDate = await strapi.services['app-basic-information'].CurrentDateTime(user.otp_generated_at);
    
    var endDate   =  await strapi.services['app-basic-information'].CurrentDateTime();

    var seconds = (endDate.getTime() - startDate.getTime());
    var Seconds_from_T1_to_T2 = seconds / 1000;
    var Seconds_Between_Dates = Math.floor(Seconds_from_T1_to_T2);
    
    if(user.otp === null) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'No otp found',
        })
      );
    } else if(Seconds_Between_Dates >= smsInfo.expiry_seconds) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'otp expired.',
        })
      );
    } else if(parseInt(user.otp) === params.otp) {
      var msg  = "Verification successfull";
      await strapi.query('user', 'users-permissions').update({ id: params.user }, { confirmed: true });
      status = true;
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

  async UpdateUserReferralCode() {
    let userRef = await strapi.query('user', 'users-permissions').find({referral_code_ne: true});
    let userAllwithNoRefercode  = await strapi.query('user', 'users-permissions').find({referral_code_null: true});
    let filterReferralCode = userRef.map(user=> user.referral_code);
    //console.log(userAllwithNoRefercode); return false;
    
    if(userAllwithNoRefercode.length>0) {
      userAllwithNoRefercode.forEach(user => {
      let referral_code = Math.random().toString(36).substr(2,6);
      if(!filterReferralCode.includes(referral_code)) {
        var updatedUser =   strapi.query('user', 'users-permissions').update({id: user.id}, {referral_code: referral_code.toUpperCase()});
        //continue;
      } else {
        let referral_code = Math.random().toString(36).substr(2,6); 
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


    if (user && user.provider === params.provider) {
      createError = new Error('Email is already taken.');
      createError.code = 400;
      throw createError;
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      createError = new Error('Email is already taken.');
      createError.code = 400;
      throw createError;
    }

    try {
      params.confirmed = true;
      params.provider = 'local';
      
      //for adding referral code while adding a user via app
      var referral_code = Math.random().toString(36).substr(2,6);
      const userRef = await strapi.query('user', 'users-permissions').findOne({
        referral_code: referral_code
      });
      params.referral_code = userRef ? Math.random().toString(36).substr(2,6).toUpperCase(): referral_code.toUpperCase(); 
      //code referral ends

      let userDate = params.dob !== '' ? new Date(params.dob) : '';
      params.dob = params.dob !== '' ? new Date(userDate.getTime() + Math.abs(userDate.getTimezoneOffset() * 60000)) : null;

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

    if (
      _.get(await store.get({ key: 'advanced' }), 'email_confirmation') &&
      user.confirmed !== true
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.confirmed',
          message: 'Your account email is not confirmed',
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
