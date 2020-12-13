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

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {

  async generateOtp(user) {
    
    let dt = new Date();
    let localTime = dt.getTime(); 
    let localOffset = dt.getTimezoneOffset(); 
    let utc = localTime + localOffset;
    let offset = 4; // GST (Gulf Standard Time) ahead +4 hours from utc
    let currentDateTime = utc + (3600000*offset); 
    let current = new Date(currentDateTime); 


    let otp =  Math.random().toFixed(4).substr(`-${4}`);
    let otpData = { otp: otp, otp_generated_at: current };
    return await strapi.query('user', 'users-permissions').update({ id: user }, otpData);
  },

  async verifyOtp(ctx) {
    let params = ctx.request.body;
    let user = await strapi.query('user', 'users-permissions').findOne({id: params.user});
    if(user.otp === null) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'otp.authenticate',
          message: 'No otp found',
        })
      );
    } else if(user.otp === params.otp) {
      var msg  = "Verification successfull";
    } else {
      var startDate = new Date(user.otp_generated_at);
      var endDate   = new Date();
      var seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
      if(seconds>1800) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'otp.authenticate',
            message: 'otp expired.',
          })
        );

      }
    }
    
    return ctx.send({ msg });
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
        var updatedUser =  strapi.query('user', 'users-permissions').update({id: user.id}, {referral_code: referral_code.toUpperCase()});
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

    if (!params.otp) {
      createError = new Error('Please verify OTP.');
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
