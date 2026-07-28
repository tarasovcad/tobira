import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";

import App from "@/features/popup/App";
import "./style.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
