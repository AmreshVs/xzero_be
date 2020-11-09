module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'mysql',
        host: env('DATABASE_HOST', '192.168.64.2'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'xzero_test'),
        username: env('DATABASE_USERNAME', 'amresh'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false),
      },
      options: {}
    },
  },
});
