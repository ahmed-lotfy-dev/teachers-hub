import { Elysia } from "elysia";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import {
  classroomStudents,
  classrooms,
  learnerAccounts,
  workspaceLearners,
  workspaces,
} from "../db/workspace-schema";
import { requireAuthSession } from "../lib/auth-session";

const workspaceQuerySchema = z.object({
  workspaceId: z.string().min(1),
});

const createClassroomBodySchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(2).max(80),
  grade: z.string().min(1).max(40),
});

const classroomParamsSchema = z.object({
  classroomId: z.string().min(1),
});

const assignStudentBodySchema = z.object({
  workspaceId: z.string().min(1),
  learnerId: z.string().min(1),
});

async function ensureTeacherOwnsWorkspace(input: {
  workspaceId: string;
  teacherUserId: string;
}): Promise<boolean> {
  const workspace = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, input.workspaceId),
        eq(workspaces.ownerUserId, input.teacherUserId),
      ),
    )
    .limit(1);

  return workspace.length > 0;
}

export const classroomRoutes = new Elysia({ prefix: "/api/classrooms" })
  .get("/", async ({ query, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedQuery = workspaceQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedQuery.error) };
    }

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: parsedQuery.data.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const classRows = await db
      .select({
        id: classrooms.id,
        name: classrooms.name,
        grade: classrooms.grade,
        createdAt: classrooms.createdAt,
      })
      .from(classrooms)
      .where(eq(classrooms.workspaceId, parsedQuery.data.workspaceId))
      .orderBy(asc(classrooms.grade), asc(classrooms.name));

    const rowsWithCounts = await Promise.all(
      classRows.map(async (row) => {
        const studentLinks = await db
          .select({ id: classroomStudents.id })
          .from(classroomStudents)
          .where(
            and(
              eq(classroomStudents.classroomId, row.id),
              eq(classroomStudents.workspaceId, parsedQuery.data.workspaceId),
              eq(classroomStudents.status, "active"),
            ),
          );

        return {
          ...row,
          activeStudentCount: studentLinks.length,
        };
      }),
    );

    return { classrooms: rowsWithCounts };
  })
  .post("/create", async ({ body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedBody = createClassroomBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: parsedBody.data.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const existing = await db
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(
        and(
          eq(classrooms.workspaceId, parsedBody.data.workspaceId),
          eq(classrooms.name, parsedBody.data.name.trim()),
          eq(classrooms.grade, parsedBody.data.grade.trim()),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      set.status = 409;
      return { error: "Classroom with same name and grade already exists" };
    }

    const inserted = await db
      .insert(classrooms)
      .values({
        id: crypto.randomUUID(),
        workspaceId: parsedBody.data.workspaceId,
        name: parsedBody.data.name.trim(),
        grade: parsedBody.data.grade.trim(),
        createdByUserId: actor.userId,
      })
      .returning({
        id: classrooms.id,
        name: classrooms.name,
        grade: classrooms.grade,
        createdAt: classrooms.createdAt,
      });

    return {
      classroom: {
        ...inserted[0],
        activeStudentCount: 0,
      },
    };
  })
  .get("/workspace-students", async ({ query, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedQuery = workspaceQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedQuery.error) };
    }

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: parsedQuery.data.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const rows = await db
      .select({
        learnerId: learnerAccounts.id,
        displayName: learnerAccounts.displayName,
        email: learnerAccounts.email,
      })
      .from(workspaceLearners)
      .innerJoin(learnerAccounts, eq(workspaceLearners.learnerId, learnerAccounts.id))
      .where(
        and(
          eq(workspaceLearners.workspaceId, parsedQuery.data.workspaceId),
          eq(workspaceLearners.actorType, "student"),
        ),
      )
      .orderBy(asc(learnerAccounts.displayName));

    return { students: rows };
  })
  .get("/:classroomId/students", async ({ params, query, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedParams = classroomParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedQuery = workspaceQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedQuery.error) };
    }

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: parsedQuery.data.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const rows = await db
      .select({
        learnerId: learnerAccounts.id,
        displayName: learnerAccounts.displayName,
        email: learnerAccounts.email,
        status: classroomStudents.status,
      })
      .from(classroomStudents)
      .innerJoin(learnerAccounts, eq(classroomStudents.learnerId, learnerAccounts.id))
      .where(
        and(
          eq(classroomStudents.classroomId, parsedParams.data.classroomId),
          eq(classroomStudents.workspaceId, parsedQuery.data.workspaceId),
        ),
      )
      .orderBy(asc(learnerAccounts.displayName));

    return { students: rows };
  })
  .post("/:classroomId/students", async ({ params, body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedParams = classroomParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedBody = assignStudentBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: parsedBody.data.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const classroomRow = await db
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(
        and(
          eq(classrooms.id, parsedParams.data.classroomId),
          eq(classrooms.workspaceId, parsedBody.data.workspaceId),
        ),
      )
      .limit(1);

    if (classroomRow.length === 0) {
      set.status = 404;
      return { error: "Classroom not found" };
    }

    const workspaceStudent = await db
      .select({ id: workspaceLearners.id })
      .from(workspaceLearners)
      .where(
        and(
          eq(workspaceLearners.workspaceId, parsedBody.data.workspaceId),
          eq(workspaceLearners.learnerId, parsedBody.data.learnerId),
          eq(workspaceLearners.actorType, "student"),
        ),
      )
      .limit(1);

    if (workspaceStudent.length === 0) {
      set.status = 400;
      return { error: "Learner is not an active student in this workspace" };
    }

    const existing = await db
      .select({ id: classroomStudents.id })
      .from(classroomStudents)
      .where(
        and(
          eq(classroomStudents.classroomId, parsedParams.data.classroomId),
          eq(classroomStudents.learnerId, parsedBody.data.learnerId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(classroomStudents)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(classroomStudents.id, existing[0].id));
    } else {
      await db.insert(classroomStudents).values({
        id: crypto.randomUUID(),
        classroomId: parsedParams.data.classroomId,
        workspaceId: parsedBody.data.workspaceId,
        learnerId: parsedBody.data.learnerId,
        status: "active",
      });
    }

    return { success: true };
  });
