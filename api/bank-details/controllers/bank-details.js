'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async TransactionInfo(user) {
    let userBankDetails = await strapi.query('bank-details').findOne({ user: user, status: true});
    let withdrawalHistory = await strapi.query('withdrawal-history').find({ user: user, status: true, _sort:'id:desc', _limit: -1 });
    return { withdrawalHistory: withdrawalHistory, userBankDetails: userBankDetails }
}
};
