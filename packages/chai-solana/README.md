# @saberhq/chai-solana

Chai helpers for Solana tests.

- Address/`PublicKey` comparisons
- `TokenAmount` comparisons
- Transaction envelope validations

## Documentation

Detailed information on how to build on Saber can be found on the [Saber developer documentation website](https://docs.saber.so/docs/developing/overview).

Automatically generated TypeScript documentation can be found [on GitHub pages](https://saber-hq.github.io/saber-common/).

## Installation

```
yarn add @saberhq/chai-solana
```

## Examples

The best way to learn how to use `chai-solana` is by example. View examples in the integration tests here:

- [Saber Merkle Distributor](https://github.com/saber-hq/merkle-distributor)
- [Saber Voter Snapshots](https://github.com/saber-hq/snapshots)

## Common Issues

### Invalid Chai property: eventually

Downgrade to Chai v4.3.4. Versions after this changed the way Chai bundled its dependencies, causing issues in how `chai-as-promised` is installed.

## License

Apache 2.0
