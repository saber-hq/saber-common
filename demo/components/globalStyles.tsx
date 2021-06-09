import { css, Global } from "@emotion/react";
import React from "react";

export const globalStyles = (
  <Global
    styles={(theme) => css`
      * {
        box-sizing: border-box;
      }

      body,
      [data-reach-dialog-overlay] {
        &::-webkit-scrollbar {
          width: 12px;
        }

        &::-webkit-scrollbar-track {
          background-color: ${theme.colors.base.primary};
        }

        &::-webkit-scrollbar-thumb {
          border-radius: 6px;
          background-color: ${theme.colors.divider.primary};
        }
      }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, Inter, "Segoe UI",
          Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        font-size: 13.3333px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: ${theme.colors.base.primary};
        color: ${theme.colors.text.default};
      }

      code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, "Courier New",
          monospace;
      }
    `}
  />
);
