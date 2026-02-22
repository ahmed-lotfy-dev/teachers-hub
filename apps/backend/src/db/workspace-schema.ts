import {
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
    title: text("title").notNull(),
    description: text("description"),
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
