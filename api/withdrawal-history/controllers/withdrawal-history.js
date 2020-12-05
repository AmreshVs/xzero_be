'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async WithdrawMoney( user, withdrawAmount, status = "pending" ) {
        let dataArray = {};
        let RemainingAmount = 0;
        let bankDetails = await strapi.query('bank-details').findOne({ user: user, status: true});
        let withdrawHistory = await strapi.query('withdrawal-history').findOne({ user: user, status: true, _sort: 'id:desc' });
        let transactions = await strapi.query('referral-code-transaction').find({ referrer: user, from:"referral", status: true });
        let totalAmount = transactions.map((transaction) => transaction.referrer_credit);
        totalAmount = totalAmount.reduce((a, b) => a + b, 0);

        if( withdrawHistory !== null ){
            RemainingAmount = withdrawHistory.remaining_amount - withdrawAmount;
        } else {
            RemainingAmount = totalAmount - withdrawAmount;
        }

        if(withdrawAmount <= totalAmount ){
            totalAmount =  totalAmount;
        } else {
            return {withdrawal: "please check the amount you entered"}
        } 
        if(RemainingAmount<0) {
            return { msg: "Wallet is empty" }
        }

        dataArray = {user:user, withdraw_amount: withdrawAmount, remaining_amount: RemainingAmount, withdrawal_status: status, total_amount: totalAmount, status: true };
        withdrawHistory = await strapi.query('withdrawal-history').create(dataArray);
        return { withdrawal: withdrawHistory, bankDetails: bankDetails,  msg: 'success' }
    }
};
