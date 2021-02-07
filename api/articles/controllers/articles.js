'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

function extend(target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
      for (var prop in source) {
          target[prop] = source[prop];
      }
  });
  return target;
}

module.exports = {
  async GetArticles(condition) {
    var queryParams = extend({}, condition.input, { _sort: 'id:desc', _limit:1 });
    let is_saved = false;
    let is_liked = false;
    let user = condition.input.user;
    delete queryParams['user'];  
    let allAtricles = await strapi.query('articles').find(queryParams);
    if(user) {
      var userSaved = await strapi.query('saved-articles').find({ user: user, _limit: -1  });
      var userLiked = await strapi.query('article-likes').find({ user: user, _limit: -1  });
      var allSaved = [].concat(...userSaved.map((userSave) => userSave.articles ? userSave.articles.split(",") : "0"  ));
      var allLiked = [].concat(...userLiked.map((userLike) => userLike.articles ? userLike.articles.split(",") : "0"  ));
    }
   
    return Promise.all(allAtricles.map(async (article) => {
      if(userSaved) {
        let savedForlater = allSaved? allSaved: "";
        is_saved = savedForlater.includes(String(article.id));
      }

      if(userLiked) {
        let likes = allLiked? allLiked: "";
        is_liked = likes.includes(String(article.id));
      }

      // get total seconds between the times
      //console.log(article.created_at); return false;
      var delta = Math.abs(new Date() - article.created_at) / 1000;

      // calculate (and subtract) whole days
      var days = Math.floor(delta / 86400);
      delta -= days * 86400;

      // calculate (and subtract) whole hours
      var hours = Math.floor(delta / 3600) % 24;
      delta -= hours * 3600;

      // calculate (and subtract) whole minutes
      var minutes = Math.floor(delta / 60) % 60;
      delta -= minutes * 60;

      // what's left is seconds
      var seconds = delta % 60;  // in theory the modulus is not required
      let added_on = days+" "+ hours+ " "+ minutes+ " " + Math.round(seconds);
      added_on = minutes+ ":" + Math.round(seconds)+" minutes ago";
      //console.log(days+" "+ hours+ " "+ minutes+ " " + Math.round(seconds)); return false;

    //   ...new Map(allAtricles.map((article) => [article["article"], article])).values(),
    // ].slice(0, 4),

      return Promise  .resolve({
        ...article,
        is_saved,
        is_liked,
        added_on
      });

    }));    
  },

  async RecentArticles() {
    let recent = [];
    let recentArticle = await strapi.query('articles').find({ video_url_null: true, _sort: 'id:desc', _limit:4  });
    let recentArticleWithVideo = await strapi.query('articles').find({ video_url_null: false, _sort: 'id:desc', _limit:2  });
    // recent.push(recentArticle);
    // recent.push(recentArticleWithVideo);
    return {
      recentArticles: recentArticle,
      recentVideos: recentArticleWithVideo
    }
  }

};
