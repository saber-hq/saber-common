module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ["*.js", "packages/*/dist/**/*"],
  extends: ["@saberhq/eslint-config-react"],
  settings: { react: { version: "detect" } },
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "tsconfig.json",
  },
};
