'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */


var fs = require("fs");
const _ = require('lodash');

module.exports = {

  async offerListWithFavourites(condition, user_id = null) {
    let is_favourite = false
    let offers = await strapi.query('offers').find(condition);
    
    return Promise.all(offers.map(async (offer) => {
      let user = await strapi.query('favourites').findOne({ user: user_id  });
      
      if(user !== null) {
        let favourites = user.favourites || "";
        is_favourite = favourites.includes(offer.id);
      }
      

      return Promise.resolve({
        ...offer,
        is_favourite
      });

    }));
  },

  async offerIsFavourite(offer_id, user_id) {
    let favourites  = "";
    let user = await strapi.query('favourites').findOne({ user: user_id });
    
    if(user !== null) {
      favourites = user.favourites;
    }
    
    let is_favourite = favourites.includes(offer_id);
    return is_favourite;
  },

  async favouritesByUser(user_id) {
    let user = await strapi.query('favourites').findOne({ user: user_id }) ;
    if(user !== null) {
      var favourites = user.favourites.replace(' ', '').split(',');
    } else {
      var favourites = [];
    }
    
    let offers = await strapi.query('offers').find({ id_in: favourites })

    return offers;
  },

  // async addFavourite(user_id, offer_id) {
  //   let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id });
  //   let userFav = user.favourites;

  //   let favArr = [];
  //   let status = false;
  //   let pop = false;

  //   // Pop
  //   if (userFav !== null && userFav.includes(',')) {
  //     userFav.replace(' ', '');
  //     favArr = userFav.split(',');
  //   }

  //   if (userFav !== null && userFav !== '' && !userFav.includes(',')) {
  //     favArr.push(String(userFav));
  //   }

  //   if (favArr.includes(String(offer_id))) {
  //     favArr = favArr.filter((fav) => Number(fav) !== Number(offer_id));
  //     pop = true
  //   }

  //   if (pop === false) {
  //     // Push
  //     if (userFav === null || userFav === '') {
  //       favArr.push(Number(offer_id));
  //       status = true;
  //     }
  //     else {
  //       favArr.push(Number(offer_id));
  //       status = true;
  //     }
  //   }

  //   await strapi.query('user', 'users-permissions').update({ id: user_id }, {
  //     favourites: favArr.length > 1 ? favArr.join(',') : (pop === false || favArr.length === 1) ? favArr[0] : null
  //   });

  //   return {
  //     status
  //   }
  // },

  async updateLocation() {
  
    let update = "updated";
    const xlsx = require('xlsx');
    let file = "./public/files/locations.xlsx";
    const workbook = xlsx.readFile(file);

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const columnA = [];

    for (let z in worksheet) {
    
      if(z.toString()[0] === 'B'){
        columnA.push({centerId: worksheet[z].v});
      } else if(z.toString()[0] === 'C') {
        columnA.push({loc: worksheet[z].v});
      }
    }
    
    const updatedArr = [];
    await Promise.all(columnA.map(async (centerLocDetails) => { 
      
      //try {

        if( typeof centerLocDetails.centerId !== 'undefined'  && typeof centerLocDetails.loc != 'undefined' ) {
          let updateCenter = await strapi.query('offers').update({ center: centerLocDetails.centerId }, {  	google_map_location: centerLocDetails.loc
        }); 

        updatedArr.push(updateCenter.id);
        }
      //} catch (err) {
        //console.log(err);
     // }
       
    }));

    console.log(updatedArr); return false;
    return { updatedArr };
  }

};
