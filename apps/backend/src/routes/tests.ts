import { Elysia } from "elysia";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import {
  testAttempts,
  tests,
  workspaceLearners,
} from "../db/workspace-schema";

const actorTypeSchema = z.enum(["student", "parent"]);

const listTestsQuerySchema = z.object({
  workspaceId: z.string().min(1),
  learnerId: z.string().min(1),
  actorType: actorTypeSchema,
});

const startTestBodySchema = z.object({
  workspaceId: z.string().min(1),
  learnerId: z.string().min(1),
  actorType: actorTypeSchema,
});

const submitTestBodySchema = z.object({
  workspaceId: z.string().min(1),
  learnerId: z.string().min(1),
  actorType: actorTypeSchema,
  score: z.number().min(0).max(100).optional(),
});

const testParamsSchema = z.object({
  testId: z.string().min(1),
});

function withinWindow(startsAt: Date | null, endsAt: Date | null): boolean {
  const now = new Date();
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  return true;
}

async function ensureLearnerWorkspaceAccess(input: {
  workspaceId: string;
  learnerId: string;
  actorType: "student" | "parent";
}) {
  const membership = await db
    .select({
      id: workspaceLearners.id,
      actorType: workspaceLearners.actorType,
    })
    .from(workspaceLearners)
    .where(
      and(
        eq(workspaceLearners.workspaceId, input.workspaceId),
        eq(workspaceLearners.learnerId, input.learnerId),
      ),
    )
    .limit(1);

  if (membership.length === 0) return { ok: false as const };
  if (membership[0].actorType !== input.actorType) return { ok: false as const };
  return { ok: true as const };
}

async function seedWorkspaceTestsIfEmpty(workspaceId: string): Promise<void> {
  const existing = await db
    .select({ id: tests.id })
    .from(tests)
    .where(eq(tests.workspaceId, workspaceId))
    .limit(1);

  if (existing.length > 0) return;

  const rows = [
    {
      id: crypto.randomUUID(),
      workspaceId,
      title: "Math Quick Check",
      description: "10-minute arithmetic readiness test.",
      maxScore: "100",
      startsAt: null,
      endsAt: null,
      published: "true",
      createdByUserId: "system_seed",
    },
    {
      id: crypto.randomUUID(),
      workspaceId,
      title: "Reading Comprehension Mini Quiz",
      description: "Short reading passage with comprehension questions.",
      maxScore: "100",
      startsAt: null,
      endsAt: null,
      published: "true",
      createdByUserId: "system_seed",
    },
  ];

  await db.insert(tests).values(rows);
}

export const testRoutes = new Elysia({ prefix: "/api/tests" })
  .get("/", async ({ query, set }) => {
    const parsedQuery = listTestsQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedQuery.error) };
    }
    const payload = parsedQuery.data;

    const access = await ensureLearnerWorkspaceAccess(payload);
    if (!access.ok) {
      set.status = 403;
      return { error: "Learner does not have access to this workspace" };
    }

    await seedWorkspaceTestsIfEmpty(payload.workspaceId);

    const testRows = await db
      .select({
        id: tests.id,
        title: tests.title,
        description: tests.description,
        maxScore: tests.maxScore,
        startsAt: tests.startsAt,
        endsAt: tests.endsAt,
      })
      .from(tests)
      .where(eq(tests.workspaceId, payload.workspaceId))
      .orderBy(asc(tests.createdAt));

    const attempts = await db
      .select({
        testId: testAttempts.testId,
        status: testAttempts.status,
        startedAt: testAttempts.startedAt,
        submittedAt: testAttempts.submittedAt,
        score: testAttempts.score,
      })
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.workspaceId, payload.workspaceId),
          eq(testAttempts.learnerId, payload.learnerId),
        ),
      );

    const attemptsByTest = new Map(attempts.map((attempt) => [attempt.testId, attempt]));

    const items = testRows.map((test) => ({
      ...test,
      canStart: payload.actorType === "student" && withinWindow(test.startsAt, test.endsAt),
      attempt: attemptsByTest.get(test.id) ?? null,
    }));

    return { tests: items };
  })
  .post("/:testId/start", async ({ params, body, set }) => {
    const parsedParams = testParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }
    const parsedBody = startTestBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    if (payload.actorType !== "student") {
      set.status = 403;
      return { error: "Only student accounts can start tests" };
    }

    const access = await ensureLearnerWorkspaceAccess(payload);
    if (!access.ok) {
      set.status = 403;
      return { error: "Learner does not have access to this workspace" };
    }

    const testRows = await db
      .select({
        id: tests.id,
        title: tests.title,
        startsAt: tests.startsAt,
        endsAt: tests.endsAt,
      })
      .from(tests)
      .where(
        and(
          eq(tests.id, parsedParams.data.testId),
          eq(tests.workspaceId, payload.workspaceId),
        ),
      )
      .limit(1);

    if (testRows.length === 0) {
      set.status = 404;
      return { error: "Test not found" };
    }

    const test = testRows[0];
    if (!withinWindow(test.startsAt, test.endsAt)) {
      set.status = 409;
      return { error: "Test is outside active time window" };
    }

    const existingAttempt = await db
      .select({
        id: testAttempts.id,
        status: testAttempts.status,
      })
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.testId, test.id),
          eq(testAttempts.workspaceId, payload.workspaceId),
          eq(testAttempts.learnerId, payload.learnerId),
        ),
      )
      .limit(1);

    if (existingAttempt.length > 0) {
      return {
        attempt: {
          id: existingAttempt[0].id,
          status: existingAttempt[0].status,
        },
      };
    }

    const inserted = await db
      .insert(testAttempts)
      .values({
        id: crypto.randomUUID(),
        testId: test.id,
        workspaceId: payload.workspaceId,
        learnerId: payload.learnerId,
        actorType: payload.actorType,
        status: "started",
      })
      .returning({
        id: testAttempts.id,
        status: testAttempts.status,
        startedAt: testAttempts.startedAt,
      });

    return { attempt: inserted[0] };
  })
  .post("/:testId/submit", async ({ params, body, set }) => {
    const parsedParams = testParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }
    const parsedBody = submitTestBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    if (payload.actorType !== "student") {
      set.status = 403;
      return { error: "Only student accounts can submit tests" };
    }

    const attemptRows = await db
      .select({
        id: testAttempts.id,
      })
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.testId, parsedParams.data.testId),
          eq(testAttempts.workspaceId, payload.workspaceId),
          eq(testAttempts.learnerId, payload.learnerId),
        ),
      )
      .limit(1);

    if (attemptRows.length === 0) {
      set.status = 404;
      return { error: "No active attempt found for this learner" };
    }

    const updated = await db
      .update(testAttempts)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        score: payload.score !== undefined ? String(payload.score) : null,
        updatedAt: new Date(),
      })
      .where(eq(testAttempts.id, attemptRows[0].id))
      .returning({
        id: testAttempts.id,
        status: testAttempts.status,
        submittedAt: testAttempts.submittedAt,
        score: testAttempts.score,
      });

    return { attempt: updated[0] };
  });
