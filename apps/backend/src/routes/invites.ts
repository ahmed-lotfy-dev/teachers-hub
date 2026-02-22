import { Elysia } from "elysia";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import {
  invites,
  learnerAccounts,
  workspaceLearners,
  workspaces,
} from "../db/workspace-schema";
import { requireAuthSession } from "../lib/auth-session";

const actorTypeSchema = z.enum(["student", "parent"]);

const createInviteBodySchema = z.object({
  workspaceId: z.string().min(1),
  studentName: z.string().min(1).max(120).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

const claimInviteBodySchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(120),
  actorType: actorTypeSchema,
});

const tokenParamsSchema = z.object({
  token: z.string().min(10),
});

function nowPlusDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const inviteRoutes = new Elysia({ prefix: "/api/invites" })
  .post("/", async ({ body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedBody = createInviteBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    const workspace = await db
      .select({ id: workspaces.id, ownerUserId: workspaces.ownerUserId })
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, payload.workspaceId),
          eq(workspaces.ownerUserId, actor.userId),
        ),
      )
      .limit(1);

    if (workspace.length === 0) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const inviteId = crypto.randomUUID();
    const token = crypto.randomUUID().replaceAll("-", "");
    const expiresAt = nowPlusDays(payload.expiresInDays ?? 7);

    const inserted = await db
      .insert(invites)
      .values({
        id: inviteId,
        token,
        workspaceId: payload.workspaceId,
        createdByUserId: actor.userId,
        studentName: payload.studentName?.trim() || null,
        expiresAt,
      })
      .returning({
        token: invites.token,
        expiresAt: invites.expiresAt,
        studentName: invites.studentName,
      });

    return {
      invite: {
        token: inserted[0].token,
        expiresAt: inserted[0].expiresAt,
        studentName: inserted[0].studentName,
        claimPath: `/invite/${inserted[0].token}`,
      },
    };
  })
  .get("/:token", async ({ params, set }) => {
    const parsedParams = tokenParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const rows = await db
      .select({
        workspaceId: invites.workspaceId,
        studentName: invites.studentName,
        expiresAt: invites.expiresAt,
        claimedAt: invites.claimedAt,
      })
      .from(invites)
      .where(eq(invites.token, parsedParams.data.token))
      .limit(1);

    if (rows.length === 0) {
      set.status = 404;
      return { valid: false, reason: "Invite not found" };
    }

    const invite = rows[0];
    const now = new Date();
    if (invite.expiresAt < now) {
      return { valid: false, reason: "Invite expired", invite };
    }
    if (invite.claimedAt) {
      return { valid: false, reason: "Invite already claimed", invite };
    }

    return { valid: true, invite };
  })
  .post("/:token/claim", async ({ params, body, set }) => {
    const parsedParams = tokenParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedBody = claimInviteBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    const inviteRows = await db
      .select({
        id: invites.id,
        workspaceId: invites.workspaceId,
        expiresAt: invites.expiresAt,
        claimedAt: invites.claimedAt,
      })
      .from(invites)
      .where(eq(invites.token, parsedParams.data.token))
      .limit(1);

    if (inviteRows.length === 0) {
      set.status = 404;
      return { error: "Invite not found" };
    }

    const invite = inviteRows[0];
    if (invite.claimedAt) {
      set.status = 409;
      return { error: "Invite already claimed" };
    }
    if (invite.expiresAt < new Date()) {
      set.status = 410;
      return { error: "Invite expired" };
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const existingLearner = await db
      .select({
        id: learnerAccounts.id,
        displayName: learnerAccounts.displayName,
      })
      .from(learnerAccounts)
      .where(eq(learnerAccounts.normalizedEmail, normalizedEmail))
      .limit(1);

    const learnerId = existingLearner[0]?.id ?? crypto.randomUUID();
    const status: "linked_existing" | "created_new" =
      existingLearner.length > 0 ? "linked_existing" : "created_new";

    if (existingLearner.length === 0) {
      await db.insert(learnerAccounts).values({
        id: learnerId,
        email: payload.email.trim(),
        normalizedEmail,
        displayName: payload.displayName.trim(),
      });
    }

    const existingWorkspaceLearner = await db
      .select({ id: workspaceLearners.id })
      .from(workspaceLearners)
      .where(
        and(
          eq(workspaceLearners.workspaceId, invite.workspaceId),
          eq(workspaceLearners.learnerId, learnerId),
        ),
      )
      .limit(1);

    if (existingWorkspaceLearner.length === 0) {
      await db.insert(workspaceLearners).values({
        id: crypto.randomUUID(),
        workspaceId: invite.workspaceId,
        learnerId,
        actorType: payload.actorType,
      });
    }

    await db
      .update(invites)
      .set({
        claimedAt: new Date(),
        claimedByLearnerId: learnerId,
        claimedByActorType: payload.actorType,
        updatedAt: new Date(),
      })
      .where(eq(invites.id, invite.id));

    return {
      result: {
        status,
        learnerId,
        workspaceId: invite.workspaceId,
        nextStepPath: `/tests?workspaceId=${invite.workspaceId}&learnerId=${learnerId}&actorType=${payload.actorType}`,
      },
    };
  });
