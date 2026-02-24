import Elysia from "elysia";
import { randomBytes, timingSafeEqual } from "node:crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function shouldUseSecureCookies(): boolean {
  return (
    !!process.env.BETTER_AUTH_URL?.startsWith("https://") &&
    process.env.NODE_ENV === "production"
  );
}

export const csrfProtection = new Elysia({ name: "csrf-protection" })
  .get("/api/csrf", ({ set }) => {
    const token = randomBytes(32).toString("hex");
    const cookieParts = [
      `${CSRF_COOKIE}=${encodeURIComponent(token)}`,
      "Path=/",
      "SameSite=Lax",
      "HttpOnly",
    ];

    if (shouldUseSecureCookies()) {
      cookieParts.push("Secure");
    }

    set.headers["Set-Cookie"] = cookieParts.join("; ");
    set.headers["Cache-Control"] = "no-store";

    return { csrfToken: token };
  })
  .onBeforeHandle(({ request, set }) => {
    if (SAFE_METHODS.has(request.method)) return;

    const url = new URL(request.url);
    if (
      url.pathname.startsWith("/api/auth") ||
      url.pathname.startsWith("/api/v1/auth") ||
      url.pathname === "/api/csrf" ||
      url.pathname === "/api/v1/csrf"
    ) {
      return;
    }

    const authHeader =
      request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return;
    }

    const cookies = parseCookies(
      request.headers.get("cookie") || request.headers.get("Cookie"),
    );
    const csrfCookie = cookies[CSRF_COOKIE];
    const csrfHeader = request.headers.get(CSRF_HEADER);

    if (!csrfCookie || !csrfHeader || !tokensMatch(csrfCookie, csrfHeader)) {
      set.status = 403;
      return { error: "Forbidden: CSRF token missing or invalid" };
    }
  });
