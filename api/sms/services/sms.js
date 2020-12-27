'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

  //Base URLS for three methods
  let base_url_SendSMS = 'https://www.experttexting.com/ExptRestApi/sms/json/Message/Send';
  let base_url_QueryBalance = 'https://www.experttexting.com/ExptRestApi/sms/json/Account/Balance?';
  
  //Public Variables that are used as parameters in API calls
  let username = 'xzero';  
  let password = 'Xzerodxb@@@02020';
  let apikey = 'kj7q5bk5ej31ib7';
  let from = 'XzeroApp';	// USE DEFAULT IN MOST CASES, CONTACT SUPPORT FOR FURTHER DETAILS>
  let to = '';		// LET THIS REMAIN BLANK
  let msgtext = ''; 	// LET THIS REMAIN BLANK

  const axios = require('axios');


module.exports = {

  async QueryBalance() {
    let fieldstring = "username="+username+"&password="+password+"&api_key="+apikey+"";
    let balance = 0; 
    
    await axios({
       method: 'get',
       url: base_url_QueryBalance+fieldstring,
       data: fieldstring,
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded'
       }
    
     })
     .then(function(response) {
       balance = response.data.Response.Balance;
       
       //console.log(response.data.Response.Balance);
       
     })
     .catch(function(response) {
       
       console.log(response);
     });
     
     return balance;

   },

  async SendMessage(mobileNumber, msg, unicode = false, senderId = null)
  {
   let type = "";
   if(unicode === true ) {
     type = "&type=unicode";
   }

   if(senderId !== null ) {
    if(senderId.toLowerCase() === "promotional") {
      from = 'AD-XzeroApp';
    } else if(senderId.toLowerCase() === "transactional") {
      from = 'XzeroApp';
    }
   }

   type = "&type=unicode";
   var fieldstring = "username="+username+"&password="+password+"&api_key="+apikey+"&FROM="+from+"&to="+mobileNumber+"&text="+msg+type;
   var send = false;
   await axios({
       method: 'post',
       url: base_url_SendSMS,
       data: fieldstring,
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded'
       }
   

     })
     .then(function(response) {

       console.log(response.data.Status); 
       
      if(response.data.Status == 0) { 
         send = true;
       }
       
       
     })
     .catch(function(response) {
      console.log(response.data);
      return response.data;
     });

     return send; 
     
 },




 async SendUnicode(mobileNumber, msg, unicode = false) {
  let type = "";
  if(unicode === true ) {
    type = "&type=unicode";
  }

  let fieldstring = "username="+username+"&password="+password+"&api_key="+apikey+"&FROM="+from+"&to="+mobileNumber+"&text="+msg+"&type=unicode";

   axios({
       method: 'post',
       url: base_url_SendSMS,
       data: fieldstring,
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded'
       }
   

     })
     .then(function(response) {
       //handle success
       console.log(response);
     })
     .catch(function(response) {
       //handle error
       console.log(response);
     });
   
 },



};
