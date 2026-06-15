import React from "react";
import ReactDOM from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App.jsx";
import "./App.css";

const PRIVY_APP_ID = "cmqdx6c0t00ws0cjm82g5tzuo";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#ff9900",
          logo: "/images/ndg-logo.png",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);