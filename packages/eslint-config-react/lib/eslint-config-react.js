"use strict";

module.exports = {
  env: {
    browser: true,
  },
  extends: [
    "@saberhq",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  settings: { react: { version: "detect" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "off",
  },
};
