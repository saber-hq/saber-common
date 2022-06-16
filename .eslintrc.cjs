// @ts-check

"use strict";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
require("@rushstack/eslint-patch/modern-module-resolution");

/** @type import('@typescript-eslint/utils').TSESLint.Linter.Config */
module.exports = {
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  settings: { react: { version: "18" } },
  extends: ["@saberhq/eslint-config-react"],
  parserOptions: {
    project: ["tsconfig.json", "./**/tsconfig*.json"],
    EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
  },
};
