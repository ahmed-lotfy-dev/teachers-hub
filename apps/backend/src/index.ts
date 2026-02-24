import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import { trustedOrigins } from "./lib/env";
import { logger } from "./middleware/logger";
import { csrfProtection } from "./middleware/csrf";
import { securityHeaders } from "./middleware/security-headers";
import { onboardingRoutes } from "./routes/onboarding";
import { inviteRoutes } from "./routes/invites";
import { testRoutes } from "./routes/tests";
import { teamsIntegrationRoutes } from "./routes/integrations-teams";
import { classroomRoutes } from "./routes/classrooms";

const API_BASE = "/api";
const API_VERSION = "v1";
const VERSIONED_API_BASE = `${API_BASE}/${API_VERSION}`;

function redirectVersionedApi(request: Request): Response {
  const url = new URL(request.url);
  const suffix = url.pathname.slice(VERSIONED_API_BASE.length);
  const targetPath = `${API_BASE}${suffix || ""}`;
  return Response.redirect(new URL(`${targetPath}${url.search}`, request.url), 308);
}

const app = new Elysia()
  .use(logger)
  .use(securityHeaders)
  .use(
    openapi({
      path: "/api/docs",
      specPath: "/api/docs/json",
      scalar: {
        url: "/api/docs/json",
      },
      documentation: {
        info: {
          title: "Teachers Hub API",
          version: API_VERSION,
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
  .use(inviteRoutes)
  .use(classroomRoutes)
  .use(testRoutes)
  .use(teamsIntegrationRoutes)
  .get(API_BASE, () => ({
    currentVersion: API_VERSION,
    supportedVersions: [API_VERSION],
    documentation: {
      current: "/api/docs",
      versionedAlias: "/api/v1/docs",
    },
  }))
  .all(VERSIONED_API_BASE, ({ request }) => redirectVersionedApi(request))
  .all(`${VERSIONED_API_BASE}/*`, ({ request }) => redirectVersionedApi(request))
  .get("/health", () => ({ status: "ok" }))
  .get("/", () => "Teachers Hub backend running")
  .listen(Number(process.env.PORT ?? 8000));

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
