'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async offerListWithFavourites(condition, user_id = 1) {
    let offers = await strapi.query('offers').find(condition);

    return Promise.all(offers.map(async ({ id, title_en, title_ar, desc_en, desc_ar, featured_img, discount }) => {
      let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id }) || { favourites: "" };
      let favourites = user.favourites || "";
      let is_favourite = favourites.includes(id);

      return Promise.resolve({
        id,
        title_en,
        title_ar,
        desc_en,
        desc_ar,
        featured_img: { url: featured_img.url },
        discount,
        is_favourite
      });
    }));
  },

  async offerIsFavourite(offer_id, user_id) {
    let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id }) || { favourites: "" };
    let favourites = user.favourites || "";
    let is_favourite = favourites.includes(offer_id);

    return is_favourite;
  },

  async favouritesByUser(user_id) {
    let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id }) || { favourites: "" };
    let favourites = user.favourites.replace(' ', '').split(',') || [];
    let offers = await strapi.query('offers').find({ id_in: favourites })

    return offers;
  },

  async addFavourite(user_id, offer_id) {
    let user = await strapi.query('user', 'users-permissions').findOne({ id: user_id });
    let userFav = user.favourites;

    let favArr = [];
    let status = false;
    let pop = false;

    // Pop
    if (userFav !== null && userFav.includes(',')) {
      userFav.replace(' ', '');
      favArr = userFav.split(',');
    }

    if (userFav !== null && userFav !== '' && !userFav.includes(',')) {
      favArr.push(String(userFav));
    }

    if (favArr.includes(String(offer_id))) {
      favArr = favArr.filter((fav) => Number(fav) !== Number(offer_id));
      pop = true
    }

    if (pop === false) {
      // Push
      if (userFav === null || userFav === '') {
        favArr.push(Number(offer_id));
        status = true;
      }
      else {
        favArr.push(Number(offer_id));
        status = true;
      }
    }

    await strapi.query('user', 'users-permissions').update({ id: user_id }, {
      favourites: favArr.length > 1 ? favArr.join(',') : (pop === false || favArr.length === 1) ? favArr[0] : null
    });

    return {
      status
    }
  }

};
