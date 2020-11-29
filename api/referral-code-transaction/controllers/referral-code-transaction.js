'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    async UsedReferralCode(user) {
        let userDetails = await strapi.query('user', 'users-permissions').findOne({ id: user });
        if(userDetails.referral_code) {
            
        }
    }
};
