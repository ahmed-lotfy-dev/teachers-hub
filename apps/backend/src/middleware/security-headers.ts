import Elysia from "elysia";

const CSP_NON_DOCS =
  "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

export const securityHeaders = new Elysia({ name: "security-headers" }).onAfterHandle(
  ({ request, set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["Referrer-Policy"] = "no-referrer";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["Permissions-Policy"] =
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

    const path = new URL(request.url).pathname;
    if (!path.startsWith("/docs")) {
      set.headers["Content-Security-Policy"] = CSP_NON_DOCS;
    }
  },
);
