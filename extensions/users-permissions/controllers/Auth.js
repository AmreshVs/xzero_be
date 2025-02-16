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
      
      let userDate = params.dob !== '' ? new Date(params.dob) : '';
      params.dob = params.dob !== '' ? new Date( userDate.getTime() + Math.abs(userDate.getTimezoneOffset()*60000) ) : null;
    
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
};
