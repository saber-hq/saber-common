import type { BigintIsh } from "@saberhq/token-utils";

import { computeD, computeY } from "./curve.js";

const assertBN = (actual: BigintIsh, expected: BigintIsh) => {
  expect(actual.toString()).toEqual(expected.toString());
};

describe("Calculator tests", () => {
  it("computeD", () => {
    assertBN(computeD(BigInt(100), BigInt(0), BigInt(0)), BigInt(0));
    assertBN(
      computeD(BigInt(100), BigInt(1000000000), BigInt(1000000000)),
      BigInt("2000000000"),
    );
    assertBN(computeD(BigInt(73), BigInt(92), BigInt(81)), BigInt(173));
    assertBN(
      computeD(BigInt(11503), BigInt(28338), BigInt(78889)),
      BigInt(107225),
    );
    assertBN(computeD(BigInt(8552), BigInt(26), BigInt(69321)), BigInt(66920));
    assertBN(computeD(BigInt(496), BigInt(62), BigInt(68567)), BigInt(57447));
    assertBN(
      computeD(
        BigInt("17653203515214796177"),
        BigInt("13789683482691983066"),
        BigInt("3964443602730479576"),
      ),
      BigInt("17754127085422462641"),
    );
  });

  it("computeY", () => {
    assertBN(computeY(BigInt(100), BigInt(100), BigInt(0)), BigInt(0));
    assertBN(computeY(BigInt(8), BigInt(94), BigInt(163)), BigInt(69));
    assertBN(
      computeY(BigInt(2137), BigInt(905777403660), BigInt(830914146046)),
      BigInt(490376033),
    );
    assertBN(
      computeY(
        BigInt("17095344176474858097"),
        BigInt(383),
        BigInt("2276818911077272163"),
      ),
      BigInt("2276917873767753112"),
    );
    assertBN(
      computeY(
        BigInt("7644937799120520965"),
        BigInt("14818904982296505121"),
        BigInt("17480022366793075404"),
      ),
      BigInt("2661117384496570284"),
    );
  });
});
