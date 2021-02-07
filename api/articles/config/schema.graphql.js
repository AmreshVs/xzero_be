
module.exports = {
  definition: `
    type AllArticles {
      id: ID!
      created_at: DateTime!
      updated_at: DateTime!
      title_en: String
      title_ar: String
      featured_img: UploadFile
      video_url: String
      views: Long
      likes: Long
      status: Boolean
      desc_en: String
      desc_ar: String
      article_category: ArticleCategories
      is_saved: Boolean
      is_liked: Boolean
      added_on: JSON
    }

    type recent {
      recentArticles: [Articles]
      recentVideos: [Articles]
    }

    input ArticlesInputs {
      id: Int, 
      status: Boolean, 
      article_category: Int, 
      user: Int 
    }


    `
  ,
  query: `
    GetArticles(input: ArticlesInputs): [AllArticles],
    RecentArticles: recent
    
    `,
  resolver: {
    Query: {
      GetArticles: {
        description: 'Return the articles',
        resolverOf: 'application::articles.articles.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api["articles"].controllers["articles"].GetArticles(options||{});
        },
      },

      RecentArticles: {
        description: 'Return the articles',
        resolverOf: 'application::articles.articles.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api["articles"].controllers["articles"].RecentArticles();
        },
      },
    },
  }
};
