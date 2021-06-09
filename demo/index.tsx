import "react-app-polyfill/ie11";

import { ThemeProvider } from "@emotion/react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Demo } from "./components/Demo";
import { globalStyles } from "./components/globalStyles";
import { WalletConnectorProvider } from "./components/WalletConnectorProvider";
import { theme } from "./utils/theme";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <WalletConnectorProvider>
        <Demo />
      </WalletConnectorProvider>
      {globalStyles}
    </ThemeProvider>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
