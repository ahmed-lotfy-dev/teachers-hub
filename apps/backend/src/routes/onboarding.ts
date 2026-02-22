import { Elysia } from "elysia";
import { and, asc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import { schools, teacherProfiles, workspaces } from "../db/workspace-schema";

function normalizeSchoolName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildWorkspaceName(displayName: string): string {
  const base = displayName.trim() || "Teacher";
  return `${base}'s Workspace`;
}

const schoolsQuerySchema = z.object({
  q: z.string().min(1).max(80).optional(),
});

const createSchoolBodySchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(80).optional(),
  country: z.string().min(2).max(80).optional(),
});

const saveTeacherBodySchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(2).max(120),
  gradeLevels: z.array(z.string().min(1).max(40)).min(1).max(30),
  schoolId: z.string().min(1).optional(),
  schoolName: z.string().min(2).max(120).optional(),
});

const teacherParamsSchema = z.object({
  userId: z.string().min(1),
});

const teacherQuerySchema = z.object({
  workspaceId: z.string().min(1).optional(),
});

export const onboardingRoutes = new Elysia({ prefix: "/api/onboarding" })
  .get(
    "/schools",
    async ({ query, set }) => {
      const parsedQuery = schoolsQuerySchema.safeParse(query);
      if (!parsedQuery.success) {
        set.status = 400;
        return { error: z.treeifyError(parsedQuery.error) };
      }

      try {
        const q = parsedQuery.data.q?.trim();
        const base = db
          .select({
            id: schools.id,
            name: schools.name,
            city: schools.city,
            country: schools.country,
          })
          .from(schools)
          .orderBy(asc(schools.name))
          .limit(20);

        const rows = q
          ? await base.where(ilike(schools.name, `%${q}%`))
          : await base;

        return { schools: rows };
      } catch (error) {
        set.status = 500;
        return {
          error:
            "Failed to load schools. Ensure database migrations are applied for onboarding tables.",
          details: error instanceof Error ? error.message : "Unknown database error",
        };
      }
    }
  )
  .post(
    "/schools",
    async ({ body, set }) => {
      const parsedBody = createSchoolBodySchema.safeParse(body);
      if (!parsedBody.success) {
        set.status = 400;
        return { error: z.treeifyError(parsedBody.error) };
      }

      const normalizedName = normalizeSchoolName(parsedBody.data.name);
      const existing = await db
        .select({
          id: schools.id,
          name: schools.name,
          city: schools.city,
          country: schools.country,
        })
        .from(schools)
        .where(eq(schools.normalizedName, normalizedName))
        .limit(1);

      if (existing.length > 0) {
        return { created: false, school: existing[0] };
      }

      const schoolId = crypto.randomUUID();
      const inserted = await db
        .insert(schools)
        .values({
          id: schoolId,
          name: parsedBody.data.name.trim(),
          normalizedName,
          city: parsedBody.data.city?.trim() || null,
          country: parsedBody.data.country?.trim() || null,
          createdByUserId: parsedBody.data.userId,
        })
        .returning({
          id: schools.id,
          name: schools.name,
          city: schools.city,
          country: schools.country,
        });

      return { created: true, school: inserted[0] };
    }
  )
  .post(
    "/teacher",
    async ({ body, set }) => {
      const parsedBody = saveTeacherBodySchema.safeParse(body);
      if (!parsedBody.success) {
        set.status = 400;
        return { error: z.treeifyError(parsedBody.error) };
      }
      const payload = parsedBody.data;

      let selectedSchoolId = payload.schoolId ?? null;

      if (!selectedSchoolId && payload.schoolName) {
        const normalizedName = normalizeSchoolName(payload.schoolName);
        const existingSchool = await db
          .select({ id: schools.id })
          .from(schools)
          .where(eq(schools.normalizedName, normalizedName))
          .limit(1);

        if (existingSchool.length > 0) {
          selectedSchoolId = existingSchool[0].id;
        } else {
          const schoolId = crypto.randomUUID();
          await db.insert(schools).values({
            id: schoolId,
            name: payload.schoolName.trim(),
            normalizedName,
            city: null,
            country: null,
            createdByUserId: payload.userId,
          });
          selectedSchoolId = schoolId;
        }
      }

      if (selectedSchoolId) {
        const existingSchool = await db
          .select({ id: schools.id })
          .from(schools)
          .where(eq(schools.id, selectedSchoolId))
          .limit(1);
        if (existingSchool.length === 0) {
          set.status = 400;
          return { error: "Selected school does not exist" };
        }
      }

      const existingWorkspace = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.ownerUserId, payload.userId))
        .limit(1);

      const workspaceId =
        existingWorkspace[0]?.id ??
        (() => {
          const id = crypto.randomUUID();
          return id;
        })();

      if (existingWorkspace.length === 0) {
        await db.insert(workspaces).values({
          id: workspaceId,
          ownerUserId: payload.userId,
          type: "teacher",
          name: buildWorkspaceName(payload.displayName),
        });
      }

      await db
        .insert(teacherProfiles)
        .values({
          userId: payload.userId,
          workspaceId,
          displayName: payload.displayName.trim(),
          schoolId: selectedSchoolId,
          gradeLevels: payload.gradeLevels,
          onboardedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: teacherProfiles.userId,
          set: {
            workspaceId,
            displayName: payload.displayName.trim(),
            schoolId: selectedSchoolId,
            gradeLevels: payload.gradeLevels,
            onboardedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      const profile = await db
        .select({
          userId: teacherProfiles.userId,
          workspaceId: teacherProfiles.workspaceId,
          displayName: teacherProfiles.displayName,
          schoolId: teacherProfiles.schoolId,
          gradeLevels: teacherProfiles.gradeLevels,
          onboardedAt: teacherProfiles.onboardedAt,
        })
        .from(teacherProfiles)
        .where(eq(teacherProfiles.userId, payload.userId))
        .limit(1);

      return { profile: profile[0] };
    }
  )
  .get(
    "/teacher/:userId",
    async ({ params, query, set }) => {
      const parsedParams = teacherParamsSchema.safeParse(params);
      if (!parsedParams.success) {
        set.status = 400;
        return { error: z.treeifyError(parsedParams.error) };
      }
      const parsedQuery = teacherQuerySchema.safeParse(query);
      if (!parsedQuery.success) {
        set.status = 400;
        return { error: z.treeifyError(parsedQuery.error) };
      }

      const base = db
        .select({
          userId: teacherProfiles.userId,
          workspaceId: teacherProfiles.workspaceId,
          displayName: teacherProfiles.displayName,
          schoolId: teacherProfiles.schoolId,
          gradeLevels: teacherProfiles.gradeLevels,
          onboardedAt: teacherProfiles.onboardedAt,
          schoolName: schools.name,
        })
        .from(teacherProfiles)
        .leftJoin(schools, eq(teacherProfiles.schoolId, schools.id))
        .limit(1);

      const profile = parsedQuery.data.workspaceId
        ? await base.where(
            and(
              eq(teacherProfiles.userId, parsedParams.data.userId),
              eq(teacherProfiles.workspaceId, parsedQuery.data.workspaceId),
            ),
          )
        : await base.where(eq(teacherProfiles.userId, parsedParams.data.userId));

      return { profile: profile[0] ?? null };
    }
  );
