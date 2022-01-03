# @saberhq/tsconfig

Saber TypeScript configurations.

## Usage

The TSConfig adds the `importHelpers`, so first run:

```bash
yarn add tslib
```

### Libraries

In your `tsconfig.json`, use the following:

```json
{
  "extends": "@saberhq/tsconfig/tsconfig.lib.json",
  "include": ["src/", "tests/"]
}
```

Note that `noEmit` is enabled by default, for typechecking.

We recommend creating both a CommonJS and ESM build. For this, add the following two files:

#### `tsconfig.esm.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "dist/cjs/"
  },
  "include": ["src/"]
}
```

#### `tsconfig.cjs.json`

```json
{
  "extends": "./tsconfig.esm.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "dist/cjs/"
  },
  "include": ["src/"]
}
```

Additionally, modify `package.json` with the following:

```json
{
  // ...
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "scripts": {
    // ...
    "build": "tsc -P tsconfig.cjs.json && tsc -P tsconfig.esm.json",
    "clean": "rm -fr dist/",
    "typecheck": "tsc"
  }
}
```
