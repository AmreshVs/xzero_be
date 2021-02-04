'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async SaveForLater(user, article) {
    
    let saveStatus = true;
    if (user === null && article === null ) {
      return false;
    }

    //checking user is exist or not
    let savedExist = await strapi
      .query("saved-articles")
      .findOne({
        user: user,
        status: true
      });
    let userSaved = "";

    if (savedExist !== null) {
      userSaved = savedExist.articles;
    }
  
    let newSaved = [];
    let status = false;
    let pop = false;
    //Pop
    if (userSaved !== null && userSaved.includes(",")) {
      userSaved.replace(" ", "");
      newSaved = userSaved.split(",");
    }
  
    if (
      userSaved !== null &&
      userSaved !== "" &&
      !userSaved.includes(",")
    ) {
      newSaved.push(String(userSaved));
    }
  
    if (newSaved.includes(String(article))) {
      newSaved = newSaved.filter(
        (fav) => Number(fav) !== Number(article)
      );
      pop = true;
    }
  
    if (pop === false) {
      // Push
      if (userSaved === null || userSaved === "") {
        newSaved.push(Number(article));
        status = true;
      } else {
        newSaved.push(Number(article));
        status = true;
      }
    }
  
    if (savedExist !== null) {
      await strapi.query("saved-articles").update({
        user: user,
      }, {
        articles: newSaved.length > 1 ?
          newSaved.join(",") : pop === false || newSaved.length === 1 ?
          newSaved[0] : null,
          status: saveStatus,
      });
      status = true;
    } else {
      await strapi
        .query("saved-articles")
        .create({
          user: user,
          articles: newSaved[0],
          status: saveStatus,
        });
      status = true;
    }
  
    return {
      status,
    };
  }
  
};
