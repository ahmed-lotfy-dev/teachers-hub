import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
