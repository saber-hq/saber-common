# `@saberhq/browserslist-config`

Saber shareable config for [Browserslist](https://www.npmjs.com/package/browserslist).

## Usage

Add this to your `package.json` file:

```
"browserslist": [
    "extends @saberhq/browserslist-config"
]
```

Alternatively, add this to your `.browserslistrc` file:

```
extends @saberhq/browserslist-config
```

This package when imported returns an array of supported browsers, for more configuration examples including Autoprefixer, Babel, ESLint, PostCSS, and stylelint see the Browserslist examples repo.

## License

Saber Common is licensed under the Apache License, Version 2.0.
