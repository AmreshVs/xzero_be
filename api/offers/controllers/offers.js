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
    let userFavourites = await strapi.query('favourites').find({ user: user_id, _limit: -1  });
    let allFav = [].concat(...userFavourites.map((userFavourite) => userFavourite.favourites? userFavourite.favourites.split(","):"0"  ));
    return Promise.all(offers.map(async (offer) => {
      if(userFavourites) {
        let favourites = allFav || "";
        is_favourite = favourites.includes(String(offer.id));
      }
      return Promise.resolve({
        ...offer,
        is_favourite
      });

    }));
  },

  async offerIsFavourite(offer_id, user_id) {
    let favourites  = "";
    let userFavourites = await strapi.query('favourites').find({ user: user_id });
    let allFav = [].concat(...userFavourites.map((userFavourite) => userFavourite.favourites? userFavourite.favourites.split(","):"0"  ));
    if(userFavourites) {
      favourites = allFav;
    }
    let is_favourite = favourites.includes(String(offer_id));
    return is_favourite;
  },

  async favouritesByUser(user_id) {
    let userFavourites = await strapi.query('favourites').find({ user: user_id });
    let fav = [].concat(...userFavourites.map((userFavourite) => userFavourite.favourites? userFavourite.favourites.split(","):"0"  ));
    if(userFavourites) {
      var favourites = fav;
    } else {
      var favourites = [];
    }
    let offers = await strapi.query('offers').find({ id_in: favourites })
    return offers;
  },

  
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
        if( typeof centerLocDetails.centerId !== 'undefined'  && typeof centerLocDetails.loc != 'undefined' ) {
          let updateCenter = await strapi.query('offers').update({ center: centerLocDetails.centerId }, {  	google_map_location: centerLocDetails.loc
        }); 
        updatedArr.push(updateCenter.id);
        }
    }));
    console.log(updatedArr); return false;
    return { updatedArr };
  },

    //Home page counts
    async HomeCounts(ctx) {
      let params = ctx.request.body;
      let favorites = await strapi.query('favourites').find({ user: params.user });
      let favoriteConcatenated = [].concat(...favorites.map((fav) => fav.favourites? fav.favourites.split(","):""));
      favorites = favoriteConcatenated.length;
      let centers = await strapi.query('centers').count({ status: true });
      let offers = await strapi.query('offers').count({ status: true });
      let specialists = await strapi.query('specialist').count();
      let konoz = await strapi.query('vouchers').count({ status: true });
      let counts = { centersCount: centers, offersCount: offers, specialistsCount: specialists, konozCount: konoz, favorites: favorites };
      return ctx.send(counts);
    }
};
