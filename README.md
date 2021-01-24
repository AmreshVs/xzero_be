Xzero Strapi Application

For Custom Partner login 
File - node_modules/strapi-plugin-content-manager/controllers/ContentManager.js
1. Line 4 - Add const bcrypt = require('bcryptjs');
2. Line 197 - Add 
    function hashPassword(user = {}) {
      return new Promise(resolve => {
        bcrypt.hash(`${user.password}`, 10, (err, hash) => {
          resolve(hash);
        });
      });
    }

    if (model === 'application::check.check') {
      data.password = await hashPassword(data);
    }
    

    if (model === 'application::konoz-publishers.konoz-publishers') {
      data.password = await hashPassword(data);
    }
3. Here "application::check.check" is the end point it may vary on admin dashboard based on the table name.