'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {

  async CurrentDateTime(dateNow = new Date()) {
    let dt = new Date(dateNow);
    let localTime = dt.getTime(); 
    let localOffset = dt.getTimezoneOffset(); 
    let utc = localTime + localOffset;
    let offset = 4; // GST (Gulf Standard Time) ahead +4 hours from utc
    let currentDateTime = utc + (3600000*offset); 
    return  new Date(currentDateTime); 
  }


};
