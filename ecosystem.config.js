module.exports = {
  apps : [
      {
        name: "xzero_be",
        script: "./server.js",
        watch: false,
        env: {
            "PORT": 1337,
            "NODE_ENV": "development"
        },
        env_production: {
            "PORT": 1337,
            "NODE_ENV": "production",
        }
      }
  ]
}
