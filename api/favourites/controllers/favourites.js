'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async AddAsFavourite(user, offer, center = null) {
      let FavouriteStatus = true;
      if(user === null && offer === null && center === null) {
          return false;
      }

      if(center === null) {
        let offerDetails = await strapi.query("offers").findOne({ id: offer, status: true });  
        center = offerDetails.center.id;
      }

     //checking user is exist or not
     let favouriteExist = await strapi.query("favourites").findOne({ user: user, center: center, status: true }); 
     let userFavourites  = '';
     if(favouriteExist!==null) {
        userFavourites = favouriteExist.favourites;
     }
     
     let newFavourites = [];
     let status = false;
     let pop = false;
     // Pop
    if (userFavourites !== null && userFavourites.includes(',')) {
        userFavourites.replace(' ', '');
        newFavourites = userFavourites.split(',');
        
      }
  
      if (userFavourites !== null && userFavourites !== '' && !userFavourites.includes(',')) {
        newFavourites.push(String(userFavourites));
      }
  
      if (newFavourites.includes(String(offer))) {
        newFavourites = newFavourites.filter((fav) => Number(fav) !== Number(offer));
        pop = true
      }
  
      if (pop === false) {
        // Push
        if (userFavourites === null || userFavourites === '') {
            newFavourites.push(Number(offer));
          status = true;
        }
        else {
            newFavourites.push(Number(offer));
            status = true;
        }
      }

      if(favouriteExist !== null) {
        await strapi.query('favourites').update({ user: user, center: center }, {
            favourites: newFavourites.length > 1 ? newFavourites.join(',') : (pop === false || newFavourites.length === 1) ? newFavourites[0] : null, status: FavouriteStatus
          });
          status = true;
      } else {
        await strapi.query('favourites').create({ user: user, center: center, favourites: newFavourites[0], status: FavouriteStatus });
          status = true;
      }
      
      return {
        status
      }
    },

    async ClearAllFavourites(user) {
      let clearFavourite = await strapi.query("favourites").update({ user: user, status: true }, { favourites: null}); 
      if(clearFavourite) {
        return true;
      }
      return false;
    }


};