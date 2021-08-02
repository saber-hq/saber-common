import { Price as UPrice } from "@ubeswap/token-math";

import type { Token } from "./token";

export class Price extends UPrice<Token> {}
