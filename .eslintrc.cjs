// @ts-check

"use strict";

// @ts-ignore
require("@rushstack/eslint-patch/modern-module-resolution");

/** @type import('eslint').Linter.Config */
module.exports = {
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ["*.js", "*.cjs"],
  settings: { react: { version: "18" } },
  extends: ["@saberhq/eslint-config-react"],
  parserOptions: {
    project: "tsconfig.json",
  },
};
