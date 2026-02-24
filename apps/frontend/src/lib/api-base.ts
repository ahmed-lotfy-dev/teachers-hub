function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}
