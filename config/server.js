module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'a308430d2bfd491027ec990136bdb42a'),
    },
  },
  //cron: { enabled: true },
});
