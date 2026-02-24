import { Elysia } from "elysia";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db";
import {
  learnerAccounts,
  questionBankItems,
  classrooms,
  classroomStudents,
  testAttempts,
  testAssignments,
  testQuestions,
  tests,
  workspaces,
  workspaceLearners,
} from "../db/workspace-schema";
import { requireAuthSession } from "../lib/auth-session";

const actorTypeSchema = z.enum(["student", "parent"]);
const questionTypeSchema = z.enum(["mcq", "multi_select", "short_text", "true_false"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);
const feedbackModeSchema = z.enum(["immediate", "after_submission", "after_due_date"]);

const listTestsQuerySchema = z.object({
  workspaceId: z.string().min(1),
  learnerId: z.string().min(1),
  actorType: actorTypeSchema,
});

const teacherListTestsQuerySchema = z.object({
  workspaceId: z.string().min(1),
});

const listQuestionBankQuerySchema = z.object({
  workspaceId: z.string().min(1),
  grade: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  skill: z.string().min(1).optional(),
  type: questionTypeSchema.optional(),
  difficulty: difficultySchema.optional(),
  status: z.string().min(1).optional(),
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
const createTestBodySchema = z.object({
  workspaceId: z.string().min(1),
  classroomId: z.string().min(1),
  title: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  grade: z.string().min(1).max(40).optional(),
  subject: z.string().min(1).max(80).optional(),
  topic: z.string().min(1).max(120).optional(),
  objective: z.string().min(2).max(240).optional(),
  questionCountTarget: z.number().int().min(1).max(100).optional(),
  timeLimitMins: z.number().int().min(1).max(300).optional(),
  attemptLimit: z.number().int().min(1).max(10).optional(),
  feedbackMode: feedbackModeSchema.optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  maxScore: z.number().int().min(1).max(1000).default(100),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

const testParamsSchema = z.object({
  testId: z.string().min(1),
});

const workspaceQuerySchema = z.object({
  workspaceId: z.string().min(1),
});

const publicTestParamsSchema = z.object({
  testId: z.string().min(1),
});

const publicStartTestBodySchema = z.object({
  childName: z.string().min(2).max(120),
});

const publicSubmitTestBodySchema = z.object({
  attemptId: z.string().min(1),
  score: z.number().min(0).max(100).optional(),
});

const createQuestionBankItemBodySchema = z.object({
  workspaceId: z.string().min(1),
  grade: z.string().min(1).max(40),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  skill: z.string().min(1).max(120),
  difficulty: difficultySchema,
  type: questionTypeSchema,
  prompt: z.string().min(4).max(5000),
  options: z.array(z.string().min(1).max(500)).min(2).max(10).optional(),
  correctAnswers: z.array(z.string().min(1).max(500)).min(1).max(10),
  explanation: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  estimatedTimeSeconds: z.number().int().min(10).max(1800).optional(),
  status: z.enum(["draft", "reviewed", "approved"]).optional(),
});

const addTestQuestionBodySchema = z.object({
  workspaceId: z.string().min(1),
  source: z.enum(["manual", "bank"]),
  questionBankItemId: z.string().min(1).optional(),
  type: questionTypeSchema.optional(),
  prompt: z.string().min(4).max(5000).optional(),
  options: z.array(z.string().min(1).max(500)).min(2).max(10).optional(),
  correctAnswers: z.array(z.string().min(1).max(500)).min(1).max(10).optional(),
  explanation: z.string().max(2000).optional(),
  difficulty: difficultySchema.optional(),
  skill: z.string().min(1).max(120).optional(),
  points: z.number().int().min(1).max(100).optional(),
  position: z.number().int().min(1).max(500).optional(),
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

async function ensureClassroomInWorkspace(input: {
  classroomId: string;
  workspaceId: string;
}): Promise<boolean> {
  const row = await db
    .select({ id: classrooms.id })
    .from(classrooms)
    .where(
      and(
        eq(classrooms.id, input.classroomId),
        eq(classrooms.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);

  return row.length > 0;
}

function normalizeOptions(options: string[] | undefined): string[] | null {
  if (!options || options.length === 0) return null;
  const normalized = options.map((value) => value.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : null;
}

function normalizePersonName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function validateQuestionContent(input: {
  type: string;
  prompt: string;
  options: unknown;
  correctAnswers: string[];
}): string[] {
  const errors: string[] = [];

  const prompt = input.prompt.trim();
  if (!prompt) errors.push("Question prompt cannot be empty.");

  const answers = input.correctAnswers.map((answer) => answer.trim()).filter(Boolean);
  if (answers.length === 0) errors.push("At least one correct answer is required.");

  if (input.type === "mcq" || input.type === "multi_select" || input.type === "true_false") {
    const options = Array.isArray(input.options)
      ? input.options.map((value) => String(value).trim()).filter(Boolean)
      : [];

    if (options.length < 2) {
      errors.push(`Question type "${input.type}" requires at least two options.`);
    }

    const optionSet = new Set(options);
    for (const answer of answers) {
      if (!optionSet.has(answer)) {
        errors.push(`Correct answer "${answer}" must exist in options.`);
      }
    }

    if (input.type === "mcq" && answers.length !== 1) {
      errors.push("MCQ questions must have exactly one correct answer.");
    }
  }

  return errors;
}

async function nextQuestionPosition(testId: string): Promise<number> {
  const existing = await db
    .select({ position: testQuestions.position })
    .from(testQuestions)
    .where(eq(testQuestions.testId, testId))
    .orderBy(desc(testQuestions.position))
    .limit(1);

  return (existing[0]?.position ?? 0) + 1;
}

async function validateTestForPublish(input: {
  workspaceId: string;
  testId: string;
}): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: { questionCount: number; targetQuestionCount: number; totalPoints: number };
}> {
  const [testRow] = await db
    .select({
      id: tests.id,
      classroomId: tests.classroomId,
      grade: tests.grade,
      subject: tests.subject,
      topic: tests.topic,
      objective: tests.objective,
      startsAt: tests.startsAt,
      endsAt: tests.endsAt,
      questionCountTarget: tests.questionCountTarget,
    })
    .from(tests)
    .where(and(eq(tests.id, input.testId), eq(tests.workspaceId, input.workspaceId)))
    .limit(1);

  if (!testRow) {
    return {
      valid: false,
      errors: ["Test not found in this workspace."],
      warnings: [],
      summary: { questionCount: 0, targetQuestionCount: 0, totalPoints: 0 },
    };
  }

  const questions = await db
    .select({
      id: testQuestions.id,
      questionType: testQuestions.questionType,
      prompt: testQuestions.prompt,
      options: testQuestions.options,
      correctAnswers: testQuestions.correctAnswers,
      points: testQuestions.points,
    })
    .from(testQuestions)
    .where(and(eq(testQuestions.testId, input.testId), eq(testQuestions.workspaceId, input.workspaceId)))
    .orderBy(asc(testQuestions.position));

  const errors: string[] = [];
  const warnings: string[] = [];
  let totalPoints = 0;

  if (!testRow.grade?.trim()) errors.push("Grade is required before publish.");
  if (!testRow.classroomId?.trim()) errors.push("Classroom is required before publish.");
  if (!testRow.subject?.trim()) errors.push("Subject is required before publish.");
  if (!testRow.topic?.trim()) errors.push("Topic is required before publish.");
  if (!testRow.objective?.trim()) errors.push("Learning objective is required before publish.");

  if (questions.length === 0) errors.push("At least one question is required before publish.");

  if (testRow.startsAt && testRow.endsAt && testRow.endsAt < testRow.startsAt) {
    errors.push("End time cannot be earlier than start time.");
  }

  for (const question of questions) {
    totalPoints += question.points;
    const questionErrors = validateQuestionContent({
      type: question.questionType,
      prompt: question.prompt,
      options: question.options,
      correctAnswers: question.correctAnswers,
    });
    for (const questionError of questionErrors) {
      errors.push(`Question ${question.id}: ${questionError}`);
    }
  }

  if (questions.length < testRow.questionCountTarget) {
    warnings.push(
      `Question count is ${questions.length}, below target ${testRow.questionCountTarget}.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      questionCount: questions.length,
      targetQuestionCount: testRow.questionCountTarget,
      totalPoints,
    },
  };
}

export const testRoutes = new Elysia({ prefix: "/api/tests" })
  .post("/create", async ({ body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedBody = createTestBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: payload.workspaceId,
      teacherUserId: actor.userId,
    });

    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const classroomExists = await ensureClassroomInWorkspace({
      classroomId: payload.classroomId,
      workspaceId: payload.workspaceId,
    });
    if (!classroomExists) {
      set.status = 400;
      return { error: "Classroom not found in this workspace" };
    }

    const startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
    const endsAt = payload.endsAt ? new Date(payload.endsAt) : null;
    if (startsAt && endsAt && endsAt < startsAt) {
      set.status = 400;
      return { error: "endsAt cannot be earlier than startsAt" };
    }

    const inserted = await db
      .insert(tests)
      .values({
        id: crypto.randomUUID(),
        workspaceId: payload.workspaceId,
        classroomId: payload.classroomId,
        targetLearnerId: null,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        grade: payload.grade?.trim() || null,
        subject: payload.subject?.trim() || null,
        topic: payload.topic?.trim() || null,
        objective: payload.objective?.trim() || null,
        status: "draft",
        questionCountTarget: payload.questionCountTarget ?? 10,
        timeLimitMins: payload.timeLimitMins ?? null,
        attemptLimit: payload.attemptLimit ?? 1,
        feedbackMode: payload.feedbackMode ?? "after_submission",
        shuffleQuestions: payload.shuffleQuestions === false ? "false" : "true",
        shuffleOptions: payload.shuffleOptions === false ? "false" : "true",
        maxScore: String(payload.maxScore),
        startsAt,
        endsAt,
        published: "false",
        createdByUserId: actor.userId,
      })
      .returning({
        id: tests.id,
        workspaceId: tests.workspaceId,
        classroomId: tests.classroomId,
        targetLearnerId: tests.targetLearnerId,
        title: tests.title,
        description: tests.description,
        grade: tests.grade,
        subject: tests.subject,
        topic: tests.topic,
        objective: tests.objective,
        status: tests.status,
        questionCountTarget: tests.questionCountTarget,
        timeLimitMins: tests.timeLimitMins,
        attemptLimit: tests.attemptLimit,
        feedbackMode: tests.feedbackMode,
        shuffleQuestions: tests.shuffleQuestions,
        shuffleOptions: tests.shuffleOptions,
        maxScore: tests.maxScore,
        startsAt: tests.startsAt,
        endsAt: tests.endsAt,
      });

    return { test: inserted[0] };
  })
  .post("/bank", async ({ body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedBody = createQuestionBankItemBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: payload.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const options = normalizeOptions(payload.options);
    const contentErrors = validateQuestionContent({
      type: payload.type,
      prompt: payload.prompt,
      options,
      correctAnswers: payload.correctAnswers,
    });
    if (contentErrors.length > 0) {
      set.status = 400;
      return { error: contentErrors };
    }

    const inserted = await db
      .insert(questionBankItems)
      .values({
        id: crypto.randomUUID(),
        workspaceId: payload.workspaceId,
        createdByUserId: actor.userId,
        grade: payload.grade.trim(),
        subject: payload.subject.trim(),
        topic: payload.topic.trim(),
        skill: payload.skill.trim(),
        difficulty: payload.difficulty,
        type: payload.type,
        prompt: payload.prompt.trim(),
        options,
        correctAnswers: payload.correctAnswers.map((value) => value.trim()),
        explanation: payload.explanation?.trim() || null,
        tags: payload.tags ?? [],
        estimatedTimeSeconds: payload.estimatedTimeSeconds ?? 60,
        status: payload.status ?? "draft",
      })
      .returning({
        id: questionBankItems.id,
        workspaceId: questionBankItems.workspaceId,
        grade: questionBankItems.grade,
        subject: questionBankItems.subject,
        topic: questionBankItems.topic,
        skill: questionBankItems.skill,
        difficulty: questionBankItems.difficulty,
        type: questionBankItems.type,
        prompt: questionBankItems.prompt,
        options: questionBankItems.options,
        correctAnswers: questionBankItems.correctAnswers,
        explanation: questionBankItems.explanation,
        tags: questionBankItems.tags,
        status: questionBankItems.status,
      });

    return { question: inserted[0] };
  })
  .get("/bank", async ({ query, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedQuery = listQuestionBankQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedQuery.error) };
    }
    const payload = parsedQuery.data;

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: payload.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const rows = await db
      .select({
        id: questionBankItems.id,
        grade: questionBankItems.grade,
        subject: questionBankItems.subject,
        topic: questionBankItems.topic,
        skill: questionBankItems.skill,
        difficulty: questionBankItems.difficulty,
        type: questionBankItems.type,
        prompt: questionBankItems.prompt,
        options: questionBankItems.options,
        correctAnswers: questionBankItems.correctAnswers,
        explanation: questionBankItems.explanation,
        tags: questionBankItems.tags,
        status: questionBankItems.status,
      })
      .from(questionBankItems)
      .where(eq(questionBankItems.workspaceId, payload.workspaceId))
      .orderBy(desc(questionBankItems.createdAt))
      .limit(200);

    const filtered = rows.filter((row) => {
      if (payload.grade && row.grade !== payload.grade) return false;
      if (payload.subject && row.subject !== payload.subject) return false;
      if (payload.topic && row.topic !== payload.topic) return false;
      if (payload.skill && row.skill !== payload.skill) return false;
      if (payload.type && row.type !== payload.type) return false;
      if (payload.difficulty && row.difficulty !== payload.difficulty) return false;
      if (payload.status && row.status !== payload.status) return false;
      return true;
    });

    return { questions: filtered };
  })
  .post("/:testId/questions", async ({ params, body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedParams = testParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedBody = addTestQuestionBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }
    const payload = parsedBody.data;

    const ownsWorkspace = await ensureTeacherOwnsWorkspace({
      workspaceId: payload.workspaceId,
      teacherUserId: actor.userId,
    });
    if (!ownsWorkspace) {
      set.status = 403;
      return { error: "Workspace not found or not owned by teacher" };
    }

    const [testRow] = await db
      .select({ id: tests.id, status: tests.status })
      .from(tests)
      .where(and(eq(tests.id, parsedParams.data.testId), eq(tests.workspaceId, payload.workspaceId)))
      .limit(1);

    if (!testRow) {
      set.status = 404;
      return { error: "Test not found" };
    }
    if (testRow.status === "published") {
      set.status = 409;
      return { error: "Cannot modify questions for a published test" };
    }

    const position = payload.position ?? (await nextQuestionPosition(parsedParams.data.testId));

    if (payload.source === "bank") {
      if (!payload.questionBankItemId) {
        set.status = 400;
        return { error: "questionBankItemId is required for bank source" };
      }

      const [bankItem] = await db
        .select({
          id: questionBankItems.id,
          type: questionBankItems.type,
          prompt: questionBankItems.prompt,
          options: questionBankItems.options,
          correctAnswers: questionBankItems.correctAnswers,
          explanation: questionBankItems.explanation,
          difficulty: questionBankItems.difficulty,
          skill: questionBankItems.skill,
        })
        .from(questionBankItems)
        .where(
          and(
            eq(questionBankItems.id, payload.questionBankItemId),
            eq(questionBankItems.workspaceId, payload.workspaceId),
          ),
        )
        .limit(1);

      if (!bankItem) {
        set.status = 404;
        return { error: "Question bank item not found" };
      }

      const inserted = await db
        .insert(testQuestions)
        .values({
          id: crypto.randomUUID(),
          testId: parsedParams.data.testId,
          workspaceId: payload.workspaceId,
          questionBankItemId: bankItem.id,
          sourceType: "bank",
          questionType: bankItem.type,
          prompt: bankItem.prompt,
          options: bankItem.options,
          correctAnswers: bankItem.correctAnswers,
          explanation: bankItem.explanation,
          difficulty: bankItem.difficulty,
          skill: bankItem.skill,
          points: payload.points ?? 1,
          position,
          createdByUserId: actor.userId,
        })
        .returning({
          id: testQuestions.id,
          testId: testQuestions.testId,
          sourceType: testQuestions.sourceType,
          questionType: testQuestions.questionType,
          prompt: testQuestions.prompt,
          options: testQuestions.options,
          correctAnswers: testQuestions.correctAnswers,
          explanation: testQuestions.explanation,
          difficulty: testQuestions.difficulty,
          skill: testQuestions.skill,
          points: testQuestions.points,
          position: testQuestions.position,
        });

      return { question: inserted[0] };
    }

    if (!payload.type || !payload.prompt || !payload.correctAnswers) {
      set.status = 400;
      return { error: "Manual question requires type, prompt, and correctAnswers." };
    }

    const options = normalizeOptions(payload.options);
    const errors = validateQuestionContent({
      type: payload.type,
      prompt: payload.prompt,
      options,
      correctAnswers: payload.correctAnswers,
    });
    if (errors.length > 0) {
      set.status = 400;
      return { error: errors };
    }

    const inserted = await db
      .insert(testQuestions)
      .values({
        id: crypto.randomUUID(),
        testId: parsedParams.data.testId,
        workspaceId: payload.workspaceId,
        questionBankItemId: null,
        sourceType: "manual",
        questionType: payload.type,
        prompt: payload.prompt.trim(),
        options,
        correctAnswers: payload.correctAnswers.map((value) => value.trim()),
        explanation: payload.explanation?.trim() || null,
        difficulty: payload.difficulty ?? "medium",
        skill: payload.skill?.trim() || null,
        points: payload.points ?? 1,
        position,
        createdByUserId: actor.userId,
      })
      .returning({
        id: testQuestions.id,
        testId: testQuestions.testId,
        sourceType: testQuestions.sourceType,
        questionType: testQuestions.questionType,
        prompt: testQuestions.prompt,
        options: testQuestions.options,
        correctAnswers: testQuestions.correctAnswers,
        explanation: testQuestions.explanation,
        difficulty: testQuestions.difficulty,
        skill: testQuestions.skill,
        points: testQuestions.points,
        position: testQuestions.position,
      });

    return { question: inserted[0] };
  })
  .get("/:testId/questions", async ({ params, query, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedParams = testParamsSchema.safeParse(params);
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
        id: testQuestions.id,
        sourceType: testQuestions.sourceType,
        questionType: testQuestions.questionType,
        prompt: testQuestions.prompt,
        options: testQuestions.options,
        correctAnswers: testQuestions.correctAnswers,
        explanation: testQuestions.explanation,
        difficulty: testQuestions.difficulty,
        skill: testQuestions.skill,
        points: testQuestions.points,
        position: testQuestions.position,
      })
      .from(testQuestions)
      .where(
        and(
          eq(testQuestions.testId, parsedParams.data.testId),
          eq(testQuestions.workspaceId, parsedQuery.data.workspaceId),
        ),
      )
      .orderBy(asc(testQuestions.position));

    return { questions: rows };
  })
  .post("/:testId/validate", async ({ params, body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedParams = testParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedBody = workspaceQuerySchema.safeParse(body);
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

    const validation = await validateTestForPublish({
      workspaceId: parsedBody.data.workspaceId,
      testId: parsedParams.data.testId,
    });

    return { validation };
  })
  .post("/:testId/publish", async ({ params, body, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedParams = testParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedBody = workspaceQuerySchema.safeParse(body);
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

    const validation = await validateTestForPublish({
      workspaceId: parsedBody.data.workspaceId,
      testId: parsedParams.data.testId,
    });
    if (!validation.valid) {
      set.status = 400;
      return { error: "Cannot publish test until validation passes", validation };
    }

    const [testRow] = await db
      .select({
        id: tests.id,
        classroomId: tests.classroomId,
      })
      .from(tests)
      .where(
        and(
          eq(tests.id, parsedParams.data.testId),
          eq(tests.workspaceId, parsedBody.data.workspaceId),
        ),
      )
      .limit(1);

    if (!testRow) {
      set.status = 404;
      return { error: "Test not found" };
    }
    if (!testRow.classroomId) {
      set.status = 400;
      return { error: "Test classroom is required before publish" };
    }

    const activeStudents = await db
      .select({
        learnerId: classroomStudents.learnerId,
      })
      .from(classroomStudents)
      .innerJoin(
        workspaceLearners,
        and(
          eq(workspaceLearners.workspaceId, classroomStudents.workspaceId),
          eq(workspaceLearners.learnerId, classroomStudents.learnerId),
        ),
      )
      .where(
        and(
          eq(classroomStudents.classroomId, testRow.classroomId),
          eq(classroomStudents.workspaceId, parsedBody.data.workspaceId),
          eq(classroomStudents.status, "active"),
          eq(workspaceLearners.actorType, "student"),
        ),
      );

    if (activeStudents.length === 0) {
      set.status = 400;
      return { error: "Cannot publish test because classroom has no active students" };
    }

    const updated = await db
      .update(tests)
      .set({
        status: "published",
        published: "true",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tests.id, parsedParams.data.testId),
          eq(tests.workspaceId, parsedBody.data.workspaceId),
        ),
      )
      .returning({
        id: tests.id,
        title: tests.title,
        status: tests.status,
        published: tests.published,
      });

    for (const student of activeStudents) {
      const existingAssignment = await db
        .select({ id: testAssignments.id })
        .from(testAssignments)
        .where(
          and(
            eq(testAssignments.testId, parsedParams.data.testId),
            eq(testAssignments.learnerId, student.learnerId),
          ),
        )
        .limit(1);

      if (existingAssignment.length > 0) continue;

      await db.insert(testAssignments).values({
        id: crypto.randomUUID(),
        testId: parsedParams.data.testId,
        workspaceId: parsedBody.data.workspaceId,
        classroomId: testRow.classroomId,
        learnerId: student.learnerId,
        status: "assigned",
      });
    }

    return {
      test: updated[0],
      validation,
      assignmentSummary: {
        assignedStudents: activeStudents.length,
      },
    };
  })
  .get("/teacher", async ({ query, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedQuery = teacherListTestsQuerySchema.safeParse(query);
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
        id: tests.id,
        title: tests.title,
        description: tests.description,
        status: tests.status,
        classroomId: tests.classroomId,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        questionCountTarget: tests.questionCountTarget,
        createdAt: tests.createdAt,
      })
      .from(tests)
      .leftJoin(classrooms, eq(tests.classroomId, classrooms.id))
      .where(eq(tests.workspaceId, parsedQuery.data.workspaceId))
      .orderBy(desc(tests.createdAt));

    return { tests: rows };
  })
  .get("/:testId/attempts", async ({ params, query, set, request }) => {
    const actor = await requireAuthSession({ request, set });
    if (!actor) return { error: "Unauthorized" };

    const parsedParams = testParamsSchema.safeParse(params);
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

    const [testRow] = await db
      .select({
        id: tests.id,
        title: tests.title,
        status: tests.status,
        classroomId: tests.classroomId,
        classroomName: classrooms.name,
      })
      .from(tests)
      .leftJoin(classrooms, eq(tests.classroomId, classrooms.id))
      .where(
        and(
          eq(tests.id, parsedParams.data.testId),
          eq(tests.workspaceId, parsedQuery.data.workspaceId),
        ),
      )
      .limit(1);

    if (!testRow) {
      set.status = 404;
      return { error: "Test not found" };
    }

    const rows = await db
      .select({
        assignmentId: testAssignments.id,
        learnerId: learnerAccounts.id,
        childName: learnerAccounts.displayName,
        childEmail: learnerAccounts.email,
        assignmentStatus: testAssignments.status,
        attemptId: testAttempts.id,
        attemptStatus: testAttempts.status,
        startedAt: testAttempts.startedAt,
        submittedAt: testAttempts.submittedAt,
        score: testAttempts.score,
      })
      .from(testAssignments)
      .innerJoin(learnerAccounts, eq(testAssignments.learnerId, learnerAccounts.id))
      .leftJoin(
        testAttempts,
        and(
          eq(testAttempts.testId, testAssignments.testId),
          eq(testAttempts.workspaceId, testAssignments.workspaceId),
          eq(testAttempts.learnerId, testAssignments.learnerId),
        ),
      )
      .where(
        and(
          eq(testAssignments.testId, parsedParams.data.testId),
          eq(testAssignments.workspaceId, parsedQuery.data.workspaceId),
        ),
      )
      .orderBy(asc(learnerAccounts.displayName));

    return {
      test: testRow,
      attempts: rows,
    };
  })
  .get("/public/:testId", async ({ params, set }) => {
    const parsedParams = publicTestParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const [testRow] = await db
      .select({
        id: tests.id,
        title: tests.title,
        description: tests.description,
        status: tests.status,
        startsAt: tests.startsAt,
        endsAt: tests.endsAt,
        classroomName: classrooms.name,
      })
      .from(tests)
      .leftJoin(classrooms, eq(tests.classroomId, classrooms.id))
      .where(eq(tests.id, parsedParams.data.testId))
      .limit(1);

    if (!testRow || testRow.status !== "published") {
      set.status = 404;
      return { error: "Test not found" };
    }

    return { test: testRow };
  })
  .post("/public/:testId/start", async ({ params, body, set }) => {
    const parsedParams = publicTestParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedBody = publicStartTestBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }

    const [testRow] = await db
      .select({
        id: tests.id,
        workspaceId: tests.workspaceId,
        startsAt: tests.startsAt,
        endsAt: tests.endsAt,
        status: tests.status,
      })
      .from(tests)
      .where(eq(tests.id, parsedParams.data.testId))
      .limit(1);

    if (!testRow || testRow.status !== "published") {
      set.status = 404;
      return { error: "Test not found" };
    }
    if (!withinWindow(testRow.startsAt, testRow.endsAt)) {
      set.status = 409;
      return { error: "Test is outside active time window" };
    }

    const targetName = normalizePersonName(parsedBody.data.childName);
    const assignments = await db
      .select({
        assignmentId: testAssignments.id,
        learnerId: learnerAccounts.id,
        childName: learnerAccounts.displayName,
      })
      .from(testAssignments)
      .innerJoin(learnerAccounts, eq(testAssignments.learnerId, learnerAccounts.id))
      .where(
        and(
          eq(testAssignments.testId, testRow.id),
          eq(testAssignments.workspaceId, testRow.workspaceId),
        ),
      );

    const matching = assignments.filter(
      (item) => normalizePersonName(item.childName) === targetName,
    );
    if (matching.length === 0) {
      set.status = 404;
      return { error: "Child name not found for this test" };
    }
    if (matching.length > 1) {
      set.status = 409;
      return { error: "Multiple students share this name. Ask teacher for direct help." };
    }

    const selected = matching[0];
    const existingAttempt = await db
      .select({
        id: testAttempts.id,
        status: testAttempts.status,
      })
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.testId, testRow.id),
          eq(testAttempts.workspaceId, testRow.workspaceId),
          eq(testAttempts.learnerId, selected.learnerId),
        ),
      )
      .limit(1);

    if (existingAttempt.length > 0) {
      return {
        attempt: {
          id: existingAttempt[0].id,
          status: existingAttempt[0].status,
          childName: selected.childName,
        },
      };
    }

    const inserted = await db
      .insert(testAttempts)
      .values({
        id: crypto.randomUUID(),
        testId: testRow.id,
        workspaceId: testRow.workspaceId,
        learnerId: selected.learnerId,
        actorType: "student",
        status: "started",
      })
      .returning({
        id: testAttempts.id,
        status: testAttempts.status,
      });

    await db
      .update(testAssignments)
      .set({
        status: "started",
        updatedAt: new Date(),
      })
      .where(eq(testAssignments.id, selected.assignmentId));

    return {
      attempt: {
        id: inserted[0].id,
        status: inserted[0].status,
        childName: selected.childName,
      },
    };
  })
  .post("/public/:testId/submit", async ({ params, body, set }) => {
    const parsedParams = publicTestParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedParams.error) };
    }

    const parsedBody = publicSubmitTestBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 400;
      return { error: z.treeifyError(parsedBody.error) };
    }

    const [attempt] = await db
      .select({
        id: testAttempts.id,
        testId: testAttempts.testId,
        workspaceId: testAttempts.workspaceId,
        learnerId: testAttempts.learnerId,
      })
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.id, parsedBody.data.attemptId),
          eq(testAttempts.testId, parsedParams.data.testId),
        ),
      )
      .limit(1);

    if (!attempt) {
      set.status = 404;
      return { error: "Attempt not found" };
    }

    const updated = await db
      .update(testAttempts)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        score: parsedBody.data.score !== undefined ? String(parsedBody.data.score) : null,
        updatedAt: new Date(),
      })
      .where(eq(testAttempts.id, attempt.id))
      .returning({
        id: testAttempts.id,
        status: testAttempts.status,
        submittedAt: testAttempts.submittedAt,
      });

    await db
      .update(testAssignments)
      .set({
        status: "submitted",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(testAssignments.testId, attempt.testId),
          eq(testAssignments.workspaceId, attempt.workspaceId),
          eq(testAssignments.learnerId, attempt.learnerId),
        ),
      );

    return { attempt: updated[0] };
  })
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

    const testRows = await db
      .select({
        id: tests.id,
        classroomId: tests.classroomId,
        targetLearnerId: tests.targetLearnerId,
        title: tests.title,
        description: tests.description,
        grade: tests.grade,
        subject: tests.subject,
        topic: tests.topic,
        objective: tests.objective,
        maxScore: tests.maxScore,
        startsAt: tests.startsAt,
        endsAt: tests.endsAt,
      })
      .from(testAssignments)
      .innerJoin(tests, eq(testAssignments.testId, tests.id))
      .where(
        and(
          eq(testAssignments.workspaceId, payload.workspaceId),
          eq(testAssignments.learnerId, payload.learnerId),
          eq(tests.workspaceId, payload.workspaceId),
          eq(tests.status, "published"),
          eq(tests.published, "true"),
        ),
      )
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

    const assignment = await db
      .select({
        id: testAssignments.id,
      })
      .from(testAssignments)
      .where(
        and(
          eq(testAssignments.testId, parsedParams.data.testId),
          eq(testAssignments.workspaceId, payload.workspaceId),
          eq(testAssignments.learnerId, payload.learnerId),
        ),
      )
      .limit(1);

    if (assignment.length === 0) {
      set.status = 403;
      return { error: "Test is not assigned to this learner" };
    }

    const testRows = await db
      .select({
        id: tests.id,
        title: tests.title,
        startsAt: tests.startsAt,
        endsAt: tests.endsAt,
        status: tests.status,
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
    if (test.status !== "published") {
      set.status = 409;
      return { error: "Test is not published yet" };
    }
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

    await db
      .update(testAssignments)
      .set({
        status: "started",
        updatedAt: new Date(),
      })
      .where(eq(testAssignments.id, assignment[0].id));

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

    const access = await ensureLearnerWorkspaceAccess(payload);
    if (!access.ok) {
      set.status = 403;
      return { error: "Learner does not have access to this workspace" };
    }

    const assignment = await db
      .select({ id: testAssignments.id })
      .from(testAssignments)
      .where(
        and(
          eq(testAssignments.testId, parsedParams.data.testId),
          eq(testAssignments.workspaceId, payload.workspaceId),
          eq(testAssignments.learnerId, payload.learnerId),
        ),
      )
      .limit(1);

    if (assignment.length === 0) {
      set.status = 403;
      return { error: "Test is not assigned to this learner" };
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

    await db
      .update(testAssignments)
      .set({
        status: "submitted",
        updatedAt: new Date(),
      })
      .where(eq(testAssignments.id, assignment[0].id));

    return { attempt: updated[0] };
  });
