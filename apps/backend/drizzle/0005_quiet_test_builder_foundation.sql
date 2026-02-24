ALTER TABLE "tests" ADD COLUMN "grade" text;
ALTER TABLE "tests" ADD COLUMN "subject" text;
ALTER TABLE "tests" ADD COLUMN "topic" text;
ALTER TABLE "tests" ADD COLUMN "objective" text;
ALTER TABLE "tests" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;
ALTER TABLE "tests" ADD COLUMN "question_count_target" integer DEFAULT 10 NOT NULL;
ALTER TABLE "tests" ADD COLUMN "time_limit_mins" integer;
ALTER TABLE "tests" ADD COLUMN "attempt_limit" integer DEFAULT 1 NOT NULL;
ALTER TABLE "tests" ADD COLUMN "feedback_mode" text DEFAULT 'after_submission' NOT NULL;
ALTER TABLE "tests" ADD COLUMN "shuffle_questions" text DEFAULT 'true' NOT NULL;
ALTER TABLE "tests" ADD COLUMN "shuffle_options" text DEFAULT 'true' NOT NULL;

CREATE TABLE "question_bank_items" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL,
  "created_by_user_id" text NOT NULL,
  "grade" text NOT NULL,
  "subject" text NOT NULL,
  "topic" text NOT NULL,
  "skill" text NOT NULL,
  "difficulty" text NOT NULL,
  "type" text NOT NULL,
  "prompt" text NOT NULL,
  "options" jsonb,
  "correct_answers" text[] DEFAULT '{}' NOT NULL,
  "explanation" text,
  "tags" text[] DEFAULT '{}' NOT NULL,
  "estimated_time_seconds" integer DEFAULT 60 NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "question_bank_items_id_workspace_idx" ON "question_bank_items" USING btree ("id","workspace_id");

CREATE TABLE "test_questions" (
  "id" text PRIMARY KEY NOT NULL,
  "test_id" text NOT NULL,
  "workspace_id" text NOT NULL,
  "question_bank_item_id" text,
  "source_type" text DEFAULT 'manual' NOT NULL,
  "question_type" text NOT NULL,
  "prompt" text NOT NULL,
  "options" jsonb,
  "correct_answers" text[] DEFAULT '{}' NOT NULL,
  "explanation" text,
  "difficulty" text DEFAULT 'medium' NOT NULL,
  "skill" text,
  "points" integer DEFAULT 1 NOT NULL,
  "position" integer NOT NULL,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "test_questions_test_position_unique" UNIQUE("test_id","position")
);
