'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async generateOtp(user) {
    let otp =  Math.random().toFixed(4).substr(`-${4}`);
    let otpData = { user:user, otp: otp, status: true };
    return await strapi.query('otp').create(otpData);
  }
};
