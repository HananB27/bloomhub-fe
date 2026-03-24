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
