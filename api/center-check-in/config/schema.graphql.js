
module.exports = {
  definition: `
    type GetMembershipInfo{
      offer: [Offers],
      membership:Membership
    }

    type OfferandUserInfo{
      centercheckin: CenterCheckIn,
    }

    type UserInfo {
      username: String
      email: String
      mobile_number: Long
      created_at: DateTime
    }

    type OffersInfo {
      title_en: String
      title_ar: String
      original_price: Int
      discounted_price: Int
      discount: Int
    }

    type UserandCenterCheckin {
      userInfo: UserInfo
      offers: [OffersInfo]
    }

    type UserPayload {
      id: Int!
      username: String
      checked_in: DateTime
      transaction_id: String
    }

    type CenterProfile {
      counts: JSON!,
      offers: [Offers], 
      recentUsers: [UserPayload],
      center: Centers
    }

  `,
  mutation: `Checkin(user_id: Int!, center_id: Int!, offers : String!): CenterCheckIn`,

  query: `
    getMembershipInfo(serial: String!, where: JSON):GetMembershipInfo!,
    getuserCheckinDetails(user_id: Int, where: JSON):OfferandUserInfo!, 
    CenterCheckinByTransactionId( transaction_id: String!): UserandCenterCheckin!,
    RecentUsers(center_id: Int!): [CenterCheckIn]!,
    getOffers(center_id: Int!): [Offers]!,
    UserCheckins(center_id: Int!): [CenterCheckIn],
    getCenterHomeData(center_id: Int!): CenterProfile!
  `,

  resolver: {
    Mutation: {
      Checkin: {
        description: 'Scan QR code and process data',
        policies: [],
        resolverOf: 'application::center-check-in.center-check-in.create',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].Checkin(options.user_id, options.center_id, options.offers);
        },
      },
    },
    Query: {
      getMembershipInfo: {
        description: 'Return the membership with offers',
        resolverOf: 'application::offers.offers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].getMembershipInfo(options.serial, options.where || {});
        },
      },

      getuserCheckinDetails: {
        description: 'Return the user with offers',
        resolverOf: 'application::center-check-in.center-check-in.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].getuserCheckinDetails(options.user_id, options.where || {});
        },
      },
      CenterCheckinByTransactionId: {
        description: 'Return center chckins by transactionid',
        resolverOf: 'application::center-check-in.center-check-in.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].CenterCheckinByTransactionId(options.transaction_id);
        },
      },
      RecentUsers: {
        description: 'Return the recent users for a center',
        resolverOf: 'application::center-check-in.center-check-in.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].RecentUsers(options.center_id);
        },
      },

      getOffers: {
        description: 'Return all offers for a specific center',
        resolverOf: 'application::offers.offers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].getOffers(options.center_id);
        },
      },

      UserCheckins: {
        description: 'Return the list of users availed offers for a specific center',
        resolverOf: 'application::center-check-in.center-check-in.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].UserCheckins(options.center_id);
        },
      },

      getCenterHomeData: {
        description: 'Return the data required for the profile',
        resolverOf: 'application::offers.offers.find',
        resolver: async (obj, options, ctx) => {
          return await strapi.api['center-check-in'].controllers['center-check-in'].getCenterHomeData(options.center_id);
        },
      }

    }
  }
}