'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const withdrawalEmailTemplate = require("../withdrawalEmailTemplate");

async function sendMail(user_id, withdrawDetails) {
  let user = await strapi
    .query("user", "users-permissions")
    .findOne({ id: user_id });
  try {
    let emailTemplate = {};
    
      emailTemplate = {
        subject: "Referrer money withdrawal",
        text: `Your request for withdrawing money has been received, `,
        html: withdrawalEmailTemplate,
      };
  
    // Send an email to the user.
    await strapi.plugins["email"].services.email.sendTemplatedEmail(
      {
        to: user.email,
        from: "support@xzero.app",
      },
     
      emailTemplate,
      {
        withdraw: withdrawDetails
      },
    );
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
    async WithdrawMoney(ctx) {
      
      const params = ctx.request.body;
      let user = params.user;
      let withdrawAmount = params.withdrawAmount;

      if(params.status) {
        var status = status.code;
      } else {
        var status = null;
      }      

        let dataArray = {};
        let RemainingAmount = 0;
        let withdrawHistory = await strapi.query('withdrawal-history').findOne({ user: user, status: true, _sort: 'id:desc' });
        let transactions = await strapi.query('referral-code-transaction').find({ referrer: user, status: true });
        let userDetails = await strapi.query('user', 'users-permissions').findOne({ id: user });
       
       
        let totalAmount = transactions.map(refer => refer.referrer_credit).reduce((a, b) => a + b, 0) ?  transactions.map(refer => refer.referrer_credit).reduce((a, b) => a + b, 0): 0;

        if(withdrawAmount <= totalAmount ){
            totalAmount =  totalAmount;
        } else {
            //return { msg: "please check the amount you entered" }
            return ctx.badRequest(
              null,
              formatError({
                id: 'withdrawal.wallet.amount',
                message: 'please check the amount you entered',
              })
            );
        } 

        if( withdrawHistory !== null ){
            RemainingAmount = withdrawHistory.remaining_amount - withdrawAmount;
            totalAmount =  withdrawHistory.remaining_amount;
            
        } else {
            RemainingAmount = totalAmount - withdrawAmount;
        }

      
        if(RemainingAmount <= 0) {
            
            return ctx.badRequest(
              null,
              formatError({
                id: 'withdrawal.wallet.empty',
                message: 'Wallet is empty',
              })
            );
        }

        dataArray = {user:user, withdraw_amount: withdrawAmount, remaining_amount: RemainingAmount, withdrawal_status: status, total_amount: totalAmount, status: true };
        withdrawHistory = await strapi.query('withdrawal-history').create(dataArray);

        //emailto admin
        await strapi.plugins['email'].services.email.send({
          to: 'noufal@xzero.app',
          from: 'admin@xzero.app',
          replyTo: 'admin@xzero.app',
          subject: 'Referrer money withdrawal',
          text: userDetails.username+' withdrawed ' +withdrawAmount+ ' money ',
          html: userDetails.username+' raised a request to withdraw ' +withdrawAmount+ ' money. wallet balance is '+RemainingAmount+ ' and total amount is '+totalAmount+"." ,
        });


        //email to user
        let sendemail = await sendMail("132", {withdraw:1, remaining: RemainingAmount, total:totalAmount})
        
        return ctx.send ({ 
          withdrawal: withdrawHistory,  
          msg: 'success'
        })
        
        
    }
};
