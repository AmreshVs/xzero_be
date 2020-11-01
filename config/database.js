module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'mysql',
        host: env('DATABASE_HOST', '108.167.187.20'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'xzero_test'),
        username: env('DATABASE_USERNAME', 'xzero_test'),
        password: env('DATABASE_PASSWORD', 'xzerotesting'),
        ssl: env.bool('DATABASE_SSL', true),
      },
      options: {}
    },
  },
});
