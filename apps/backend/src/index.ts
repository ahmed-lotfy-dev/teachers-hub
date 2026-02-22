import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import { trustedOrigins } from "./lib/env";
import { mcpPlugin } from "./mcp";
import { logger } from "./middleware/logger";
import { csrfProtection } from "./middleware/csrf";
import { securityHeaders } from "./middleware/security-headers";
import { onboardingRoutes } from "./routes/onboarding";

const app = new Elysia()
  .use(logger)
  .use(securityHeaders)
  .use(
    openapi({
      path: "/docs",
      documentation: {
        info: {
          title: "Teachers Hub API",
          version: "1.0.0",
        },
      },
    }),
  )
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get("origin");
        if (!origin) return true;
        return trustedOrigins.includes(origin);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "Accept",
        "X-CSRF-Token",
      ],
    }),
  )
  .use(csrfProtection)
  .mount(auth.handler)
  .use(onboardingRoutes)
  .get("/health", () => ({ status: "ok" }))
  .get("/", () => "Teachers Hub backend running")
  .use(mcpPlugin)
  .listen(Number(process.env.PORT ?? 8000));

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
