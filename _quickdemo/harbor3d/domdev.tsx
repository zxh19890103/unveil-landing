import ReactDOM from "react-dom/client";
import App from "./html/App.js";
import React from "react";

ReactDOM.createRoot(document.querySelector(".App"), {}).render(
  React.createElement(App, { children: null })
);
