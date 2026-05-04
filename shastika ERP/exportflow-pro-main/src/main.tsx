import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force the dark + gold theme globally
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
