import { Elysia } from "elysia";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import {
  learnerAccounts,
  workspaceLearners,
  workspaces,
} from "../db/workspace-schema";
import { requireAuthSession } from "../lib/auth-session";

const actorTypeSchema = z.enum(["student", "parent"]);

const listTeamsBodySchema = z.object({
  workspaceId: z.string().min(1),
  accessToken: z.string().min(20),
});

const importMembersBodySchema = z.object({
  workspaceId: z.string().min(1),
  teamId: z.string().min(1),
  accessToken: z.string().min(20),
  actorType: actorTypeSchema.default("student"),
});

type JoinedTeam = {
  id: string;
  displayName: string;
  description?: string | null;
};

type TeamMember = {
  id?: string;
  displayName?: string;
  email?: string;
  userId?: string;
  roles?: string[];
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function memberEmail(member: TeamMember): string | null {
  const candidate = member.email ?? member.userId ?? null;
  if (!candidate) return null;
  const normalized = normalizeEmail(candidate);
  return normalized.includes("@") ? normalized : null;
}

async function ensureTeacherOwnsWorkspace(input: {
  workspaceId: string;
  teacherUserId: string;
}): Promise<boolean> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, input.workspaceId),
        eq(workspaces.ownerUserId, input.teacherUserId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

async function graphGet<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Graph API failed (${response.status})`);
  }

  return (await response.json()) as T;
}

type GraphPage<T> = {
  value: T[];
  "@odata.nextLink"?: string;
};

async function fetchAllGraphPages<T>(url: string, token: string): Promise<T[]> {
  const all: T[] = [];
  let next: string | undefined = url;

  while (next) {
    const page: GraphPage<T> = await graphGet<GraphPage<T>>(next, token);
    all.push(...(page.value ?? []));
    next = page["@odata.nextLink"];
  }

  return all;
}

export const teamsIntegrationRoutes = new Elysia({
  prefix: "/api/integrations/teams",
})
  .post("/list", async ({ body, request, set }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedBody = listTeamsBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    const allowed = await ensureTeacherOwnsWorkspace({
      workspaceId: payload.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!allowed) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    try {
      const data = await graphGet<{ value?: JoinedTeam[] }>(
        "https://graph.microsoft.com/v1.0/me/joinedTeams",
        payload.accessToken,
      );

      const teams = (data.value ?? []).map((team) => ({
        id: team.id,
        displayName: team.displayName,
        description: team.description ?? null,
      }));

      return { teams };
    } catch (error) {
      set.status = 400;
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load teams from Microsoft Graph",
      };
    }
  })
  .post("/import", async ({ body, request, set }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedBody = importMembersBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    const allowed = await ensureTeacherOwnsWorkspace({
      workspaceId: payload.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!allowed) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    try {
      const members = await fetchAllGraphPages<TeamMember>(
        `https://graph.microsoft.com/v1.0/teams/${encodeURIComponent(payload.teamId)}/members`,
        payload.accessToken,
      );

      let createdLearners = 0;
      let linkedExistingLearners = 0;
      let alreadyLinkedInWorkspace = 0;
      let skippedMembers = 0;

      for (const member of members) {
        if ((member.roles ?? []).includes("owner")) {
          skippedMembers += 1;
          continue;
        }

        const normalizedEmail = memberEmail(member);
        if (!normalizedEmail) {
          skippedMembers += 1;
          continue;
        }

        const existingLearner = await db
          .select({ id: learnerAccounts.id })
          .from(learnerAccounts)
          .where(eq(learnerAccounts.normalizedEmail, normalizedEmail))
          .limit(1);

        let learnerId = existingLearner[0]?.id;
        if (!learnerId) {
          learnerId = crypto.randomUUID();
          await db.insert(learnerAccounts).values({
            id: learnerId,
            email: normalizedEmail,
            normalizedEmail,
            displayName: member.displayName?.trim() || normalizedEmail,
          });
          createdLearners += 1;
        } else {
          linkedExistingLearners += 1;
        }

        const existingWorkspaceLink = await db
          .select({ id: workspaceLearners.id })
          .from(workspaceLearners)
          .where(
            and(
              eq(workspaceLearners.workspaceId, payload.workspaceId),
              eq(workspaceLearners.learnerId, learnerId),
            ),
          )
          .limit(1);

        if (existingWorkspaceLink.length > 0) {
          alreadyLinkedInWorkspace += 1;
          continue;
        }

        await db.insert(workspaceLearners).values({
          id: crypto.randomUUID(),
          workspaceId: payload.workspaceId,
          learnerId,
          actorType: payload.actorType,
        });
      }

      return {
        result: {
          importedMembers: members.length,
          createdLearners,
          linkedExistingLearners,
          alreadyLinkedInWorkspace,
          skippedMembers,
        },
      };
    } catch (error) {
      set.status = 400;
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import members from Microsoft Teams",
      };
    }
  });
