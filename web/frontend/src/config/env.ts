export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || "development",
  SHOPIFY_API_KEY: import.meta.env.VITE_SHOPIFY_API_KEY || "",
  BACKEND_PORT: import.meta.env.BACKEND_PORT || "3000",
  FRONTEND_PORT: import.meta.env.FRONTEND_PORT || "3001",
} as const;

export const isDevelopment = ENV.NODE_ENV === "development";
export const isProduction = ENV.NODE_ENV === "production";
