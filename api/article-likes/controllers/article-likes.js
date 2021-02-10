'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async Like(user, article) {
    let likeStatus = true;
    if (user === null && article === null ) {
      return false;
    }

    //checking user is exist or not
    let likedExist = await strapi
      .query("article-likes")
      .findOne({
        user: user,
        status: true
      });
    let userLiked = "";

    if (likedExist !== null) {
      userLiked = likedExist.articles;
    }
  
    let newLiked = [];
    let status = false;
    let pop = false;
    //Pop
    if (userLiked !== null && userLiked.includes(",")) {
      userLiked.replace(" ", "");
      newLiked = userLiked.split(",");
    }
  
    if (
      userLiked !== null &&
      userLiked !== "" &&
      !userLiked.includes(",")
    ) {
      newLiked.push(String(userLiked));
    }
  
    if (newLiked.includes(String(article))) {
      newLiked = newLiked.filter(
        (fav) => Number(fav) !== Number(article)
      );
      pop = true;
    }
  
    if (pop === false) {
      // Push
      if (userLiked === null || userLiked === "") {
        newLiked.push(Number(article));
        status = true;
      } else {
        newLiked.push(Number(article));
        status = true;
      }
    }
  
    if (likedExist !== null) {
      await strapi.query("article-likes").update({
        user: user,
      }, {
        articles: newLiked.length > 1 ?
        newLiked.join(",") : pop === false || newLiked.length === 1 ?
        newLiked[0] : null,
          status: likeStatus,
      });

      if(pop === false) {
        let articleDetails = await strapi.query("articles").findOne({ id : article });
        await strapi.query("articles").update({ id : article }, { likes: parseInt(articleDetails.likes)+1 });
      }

      status = true;
    } else {
      await strapi
        .query("article-likes")
        .create({
          user: user,
          articles: newLiked[0],
          status: likeStatus,
        });
      status = true;
      if(pop === false) {
        let articleDetails = await strapi.query("articles").findOne({ id : article });
        await strapi.query("articles").update({ id : article }, { likes: parseInt(articleDetails.likes)+1 });
      }
    }
    status = pop;
    return {
      status,
    };
  }
};
