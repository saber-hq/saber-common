require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  settings: {
    "import/resolver": "node",
  },
  ignorePatterns: ["*.js", "packages/*/dist/**/*"],
  extends: ["@saberhq/eslint-config-react"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "tsconfig.json",
  },
};
