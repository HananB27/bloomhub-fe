export const getApiBaseUrl = (): string => {
  const env = process.env.NEXT_PUBLIC_ENV;

  switch (env) {
    case "local":
      return "http://localhost:8000";
    case "dev":
      return "https://bloomhub-be.onrender.com";
    case "prod":
      return "https://bloomhub-be-p.onrender.com";
    default:
      if (process.env.NODE_ENV === "development") {
        return "http://localhost:8000";
      }
      return "https://bloomhub-be.onrender.com";
  }
};

export const API_BASE_URL = getApiBaseUrl();

export const getFrontendBaseUrl = (): string => {
  const configuredUrl = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "";
};
