module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'mysql',
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'xzero_be'),
        username: env('DATABASE_USERNAME', 'xzero_be'),
        password: env('DATABASE_PASSWORD', '3&Fd,Ie?6y0~'),
        ssl: env.bool('DATABASE_SSL', true),
      },
      options: {}
    },
  },
});
