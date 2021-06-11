import "@emotion/react";

export const themeJSON = {
  "bg gradient": "linear-gradient(0deg, #09090c 36%, #097a51 100%)",
  dark: {
    overlay: "rgba(23,23,23,0.8)",
    button: {
      primary: {
        buttontext: { muted: "#9091a1", default: "#fff" },
        base: {
          default: "linear-gradient(0deg, #6166dc 0%, #3c42ce 100%)",
          hover: "linear-gradient(0deg, #7b7fe8 0%, #5b60de 100%)",
          pressed: "linear-gradient(0deg, #3d43d0 0%, #272dbd 100%)",
          disabled: "linear-gradient(0deg, #292b51 0%, #1d1e3a 100%)",
        },
      },
      secondary: {
        base: {
          default: "linear-gradient(0deg, #616774 0%, #403f4c 100%)",
          disabled: "linear-gradient(0deg, #35373b 0%, #2c2b30 100%)",
          hover: "linear-gradient(0deg, #767b87 0%, #5e5d6f 100%)",
          pressed: "linear-gradient(0deg, #4c515b 0%, #35353e 100%)",
        },
        buttontext: { default: "#fff", disabled: "#5f606c" },
      },
    },
    text: {
      muted: "#464a4f",
      default: "#868f97",
      bold: "#fff",
      accent: "#55bbf7",
      green: "#4ebe96",
      orange: "#f99d69",
      red: "#d84f68",
    },
    base: { primary: "#1a1b20", secondary: "#131419", tertiary: "#26272b" },
    divider: { primary: "#313131", secondary: "#1d1e23" },
    iconselector: {
      icon: { default: "#b0b0b0" },
      base: { default: "#26272b", hover: "#212228" },
    },
    cryptoselector: { base: { default: "#1a1b20", hover: "#212228" } },
    tabs: { base: { active: "#131419" } },
    brand: { logo: "#fff" },
    gradients: {
      phantom: "linear-gradient(0deg, #5347b7 0%, #551ff3 100%)",
      sollet: "linear-gradient(0deg, #067ad7 0%, #2196f3 100%)",
      ledger: "linear-gradient(0deg, #616774 0%, #403f4c 100%)",
    },
    modal: { item: { base: { hover: "#101112" } }, base: { default: "#000" } },
  },
  gradients: {
    mathwallet: "linear-gradient(0deg, #8c8f97 0%, #565657 100%)",
    solletextension: "linear-gradient(0deg, #2196f3 0%, #067ad7 100%)",
  },
  buttontext: {
    fontWeight: 500,
    fontSize: "18px",
    textDecoration: "none",
    fontStyle: "normal",
    fontStretch: "normal",
    letterSpacing: "0%",
    textIndent: "0px",
  },
  smallbuttontext: {
    fontWeight: 600,
    fontSize: "16px",
    textDecoration: "none",
    fontStyle: "normal",
    fontStretch: "normal",
    letterSpacing: "0%",
    textIndent: "0px",
  },
  "swap box shadow": "0px 4px 8px rgba(0,0,0,0.25)",
  modalshadow: "0px 16px 70px rgba(0,0,0,0.5)",
} as const;

const { dark: colors, ...themeRest } = themeJSON;

export const theme = {
  mono: `font-family: "Roboto Mono", monospace;`,
  colors,
  ...themeRest,
} as const;

type SSTheme = typeof theme;

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends SSTheme {}
}
