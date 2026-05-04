import { API_BASE_URL } from "@/lib/config";

export function resolveApiMediaUrl(url: string): string {
  const t = url.trim();
  if (!t) return url;
  if (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("blob:") ||
    t.startsWith("data:")
  ) {
    return url;
  }
  if (t.startsWith("//")) {
    return `https:${t}`;
  }
  if (t.startsWith("/")) {
    const base = API_BASE_URL.replace(/\/$/, "");
    return `${base}${t}`;
  }
  return url;
}
