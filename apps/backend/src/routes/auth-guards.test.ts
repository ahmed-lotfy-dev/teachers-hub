import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { inviteRoutes } from "./invites";
import { onboardingRoutes } from "./onboarding";

function createTestApp() {
  return new Elysia().use(onboardingRoutes).use(inviteRoutes);
}

describe("auth guards", () => {
  it("rejects unauthenticated teacher profile reads", async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request("http://localhost/api/onboarding/teacher/me"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects unauthenticated school creation", async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request("http://localhost/api/onboarding/schools", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ name: "Test School" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects unauthenticated invite creation", async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request("http://localhost/api/invites", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: "workspace_1",
          studentName: "Student",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
