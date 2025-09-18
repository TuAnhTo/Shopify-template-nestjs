import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initI18n } from "@/utils/i18n";
import App from "./App";

// Ensure that locales are loaded before rendering the app
initI18n()
  .then(() => {
    const rootElement = document.getElementById("app");
    if (!rootElement) {
      throw new Error('Root element with id "app" not found');
    }

    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to initialize i18n:", error);
  });
