const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}
