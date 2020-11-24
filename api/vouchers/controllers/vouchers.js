'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async AvailableVouchers(condtion) {
        let vouchers = await strapi.query("vouchers").find({ status :1, membership_plans: condtion.membership_plan });
        let VouchersAvailed = await strapi.query("voucher-availed").find(condtion);
        return { vouchers: vouchers, AvailedVouchers: VouchersAvailed };   
    }
};
