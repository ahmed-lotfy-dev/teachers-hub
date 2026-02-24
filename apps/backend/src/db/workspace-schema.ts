import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const schools = pgTable(
  "schools",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    city: text("city"),
    country: text("country"),
    createdByUserId: text("created_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    normalizedNameUnique: uniqueIndex("schools_normalized_name_idx").on(
      table.normalizedName,
    ),
  }),
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    type: text("type").notNull().default("teacher"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    ownerUserIdUnique: uniqueIndex("workspaces_owner_user_id_idx").on(
      table.ownerUserId,
    ),
  }),
);

export const teacherProfiles = pgTable(
  "teacher_profiles",
  {
    userId: text("user_id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    displayName: text("display_name").notNull(),
    schoolId: text("school_id"),
    gradeLevels: text("grade_levels").array().notNull().default([]),
    onboardedAt: timestamp("onboarded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdUnique: uniqueIndex("teacher_profiles_workspace_id_idx").on(
      table.workspaceId,
    ),
  }),
);

export const learnerAccounts = pgTable(
  "learner_accounts",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    normalizedEmailUnique: uniqueIndex("learner_accounts_email_idx").on(
      table.normalizedEmail,
    ),
  }),
);

export const workspaceLearners = pgTable(
  "workspace_learners",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    learnerId: text("learner_id").notNull(),
    actorType: text("actor_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceLearnerUnique: unique("workspace_learners_workspace_learner_unique").on(
      table.workspaceId,
      table.learnerId,
    ),
  }),
);

export const invites = pgTable(
  "invites",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    workspaceId: text("workspace_id").notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    studentName: text("student_name"),
    expiresAt: timestamp("expires_at").notNull(),
    claimedAt: timestamp("claimed_at"),
    claimedByLearnerId: text("claimed_by_learner_id"),
    claimedByActorType: text("claimed_by_actor_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("invites_token_idx").on(table.token),
  }),
);

export const tests = pgTable(
  "tests",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    classroomId: text("classroom_id"),
    targetLearnerId: text("target_learner_id"),
    title: text("title").notNull(),
    description: text("description"),
    grade: text("grade"),
    subject: text("subject"),
    topic: text("topic"),
    objective: text("objective"),
    status: text("status").notNull().default("draft"),
    questionCountTarget: integer("question_count_target").notNull().default(10),
    timeLimitMins: integer("time_limit_mins"),
    attemptLimit: integer("attempt_limit").notNull().default(1),
    feedbackMode: text("feedback_mode").notNull().default("after_submission"),
    shuffleQuestions: text("shuffle_questions").notNull().default("true"),
    shuffleOptions: text("shuffle_options").notNull().default("true"),
    maxScore: text("max_score").notNull().default("100"),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    published: text("published").notNull().default("true"),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: uniqueIndex("tests_id_workspace_idx").on(
      table.id,
      table.workspaceId,
    ),
  }),
);

export const classrooms = pgTable(
  "classrooms",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: text("name").notNull(),
    grade: text("grade").notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceNameGradeUnique: unique("classrooms_workspace_name_grade_unique").on(
      table.workspaceId,
      table.name,
      table.grade,
    ),
  }),
);

export const classroomStudents = pgTable(
  "classroom_students",
  {
    id: text("id").primaryKey(),
    classroomId: text("classroom_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    learnerId: text("learner_id").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    classroomLearnerUnique: unique("classroom_students_classroom_learner_unique").on(
      table.classroomId,
      table.learnerId,
    ),
  }),
);

export const testAssignments = pgTable(
  "test_assignments",
  {
    id: text("id").primaryKey(),
    testId: text("test_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    classroomId: text("classroom_id").notNull(),
    learnerId: text("learner_id").notNull(),
    status: text("status").notNull().default("assigned"),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    testLearnerUnique: unique("test_assignments_test_learner_unique").on(
      table.testId,
      table.learnerId,
    ),
  }),
);

export const questionBankItems = pgTable(
  "question_bank_items",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    grade: text("grade").notNull(),
    subject: text("subject").notNull(),
    topic: text("topic").notNull(),
    skill: text("skill").notNull(),
    difficulty: text("difficulty").notNull(),
    type: text("type").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options"),
    correctAnswers: text("correct_answers").array().notNull().default([]),
    explanation: text("explanation"),
    tags: text("tags").array().notNull().default([]),
    estimatedTimeSeconds: integer("estimated_time_seconds").notNull().default(60),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: uniqueIndex("question_bank_items_id_workspace_idx").on(
      table.id,
      table.workspaceId,
    ),
  }),
);

export const testQuestions = pgTable(
  "test_questions",
  {
    id: text("id").primaryKey(),
    testId: text("test_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    questionBankItemId: text("question_bank_item_id"),
    sourceType: text("source_type").notNull().default("manual"),
    questionType: text("question_type").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options"),
    correctAnswers: text("correct_answers").array().notNull().default([]),
    explanation: text("explanation"),
    difficulty: text("difficulty").notNull().default("medium"),
    skill: text("skill"),
    points: integer("points").notNull().default(1),
    position: integer("position").notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    testQuestionPositionUnique: unique("test_questions_test_position_unique").on(
      table.testId,
      table.position,
    ),
  }),
);

export const testAttempts = pgTable(
  "test_attempts",
  {
    id: text("id").primaryKey(),
    testId: text("test_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    learnerId: text("learner_id").notNull(),
    actorType: text("actor_type").notNull(),
    status: text("status").notNull().default("started"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    submittedAt: timestamp("submitted_at"),
    score: text("score"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueOpenAttempt: unique("test_attempts_test_learner_unique").on(
      table.testId,
      table.learnerId,
      table.workspaceId,
    ),
  }),
);
