const image = require("@rollup/plugin-image");

module.exports = {
  rollup(config) {
    config.plugins.unshift(image());
    return config;
  },
};
