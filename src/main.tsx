import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeVariantProvider } from "@/context/ThemeVariantContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ThemeVariantProvider>
      <App />
    </ThemeVariantProvider>
  </ThemeProvider>,
);
