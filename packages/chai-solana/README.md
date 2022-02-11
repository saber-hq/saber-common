# `@saberhq/chai-solana`

Chai helpers for Solana tests.

## Installation

```
yarn add @saberhq/chai-solana
```

## Common Issues

### Invalid Chai property: eventually

Downgrade to Chai v4.3.4. Versions after this changed the way Chai bundled its dependencies, causing issues in how `chai-as-promised` is installed.

## License

Apache 2.0
