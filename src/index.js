import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
  {/* <Analytics> */}
    {/* <SpeedInsights> */}
      <App />
      {/* </SpeedInsights> */}
    {/* </Analytics> */}
  </BrowserRouter>
);
