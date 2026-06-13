import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Critical Error: '#root' element not found in index.html. Initialization failed.");
}

createRoot(rootEl).render(<App />);
