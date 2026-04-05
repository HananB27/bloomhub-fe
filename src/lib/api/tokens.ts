export interface StoredToken {
  access: string;
  refresh?: string;
  user?: Record<string, unknown>;
}

const TOKEN_KEY = "auth_tokens";
const USER_KEY = "auth_user";

function readStoredTokens(): StoredToken | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? (JSON.parse(stored) as StoredToken) : null;
  } catch {
    return null;
  }
}

export function storeTokens(data: {
  access?: string;
  access_token?: string;
  refresh?: string;
  refresh_token?: string;
  user?: Record<string, unknown>;
}): void {
  const accessToken = data.access || data.access_token;
  const refreshToken = data.refresh || data.refresh_token;

  if (!accessToken) {
    console.error("No access token provided to storeTokens");
    return;
  }

  if (typeof window === "undefined") return;

  const tokens: StoredToken = {
    access: accessToken,
    ...(refreshToken && { refresh: refreshToken }),
    ...(data.user && { user: data.user }),
  };

  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  if (typeof document !== "undefined") {
    document.cookie = `access_token=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
    if (refreshToken) {
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
    }
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return readStoredTokens()?.access ?? localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return readStoredTokens()?.refresh ?? localStorage.getItem("refresh_token");
}

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const tokens = readStoredTokens();
    if (tokens?.user) return tokens.user;
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0";
  document.cookie = "refresh_token=; path=/; max-age=0";
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
