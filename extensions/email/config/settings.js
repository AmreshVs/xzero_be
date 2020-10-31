module.exports = {
  provider: 'smtp',
  providerOptions: {
    host: 'mail.xzero.app', //SMTP Host
    port: 587, //SMTP Port
    secure: false,
    username: 'admin@xzero.app',
    password: 'Xzero@123',
    rejectUnauthorized: false,
    requireTLS: false,
    connectionTimeout: 1,
  },
  settings: {
    from: 'admin@xzero.app',
    replyTo: 'admin@xzero.app'
  },
};
