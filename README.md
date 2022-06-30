# `saber-common`

Common libraries across Saber projects.

## Documentation

Detailed information on how to build on Saber can be found on the [Saber developer documentation website](https://docs.saber.so/docs/developing/overview).

Automatically generated TypeScript documentation can be found [on GitHub pages](https://saber-hq.github.io/saber-common/).

### Common Errors

#### Module parse failed: Unexpected token

`saber-common` [targets ES2019](packages/tsconfig/tsconfig.lib.json), which is [widely supported by modern DApp browsers](https://caniuse.com/?search=es2019). Please ensure that your build pipeline supports this version of ECMAScript.

## Packages

| Package                        | Description                              | Version                                                                                                                             |
| :----------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `@saberhq/anchor-contrib`      | TypeScript client for Anchor programs    | [![npm](https://img.shields.io/npm/v/@saberhq/anchor-contrib.svg)](https://www.npmjs.com/package/@saberhq/anchor-contrib)           |
| `@saberhq/browserslist-config` | Saber shareable config for Browserslist. | [![npm](https://img.shields.io/npm/v/@saberhq/browserslist-config.svg)](https://www.npmjs.com/package/@saberhq/browserslist-config) |
| `@saberhq/chai-solana`         | Chai test helpers                        | [![npm](https://img.shields.io/npm/v/@saberhq/chai-solana.svg)](https://www.npmjs.com/package/@saberhq/chai-solana)                 |
| `@saberhq/solana-contrib`      | Solana TypeScript utilities              | [![npm](https://img.shields.io/npm/v/@saberhq/solana-contrib.svg)](https://www.npmjs.com/package/@saberhq/solana-contrib)           |
| `@saberhq/stableswap-sdk`      | StableSwap SDK                           | [![npm](https://img.shields.io/npm/v/@saberhq/stableswap-sdk.svg)](https://www.npmjs.com/package/@saberhq/stableswap-sdk)           |
| `@saberhq/token-utils`         | SPL Token arithmetic and types           | [![npm](https://img.shields.io/npm/v/@saberhq/token-utils.svg)](https://www.npmjs.com/package/@saberhq/token-utils)                 |
| `@saberhq/use-solana`          | Solana React library                     | [![npm](https://img.shields.io/npm/v/@saberhq/use-solana.svg)](https://www.npmjs.com/package/@saberhq/use-solana)                   |

## Release

To release a new version of Saber Common, navigate to [the release action page](https://github.com/saber-hq/saber-common/actions/workflows/release.yml) and click "Run workflow".

There, you may specify `patch`, `minor`, or `major`.

## Join Us

We're looking for contributors! Reach out to team@saber.so or message **michaelhly** on [Keybase](https://keybase.io/) with any questions.

## License

Saber Common is licensed under the Apache License, Version 2.0.
