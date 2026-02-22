CREATE TABLE "test_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"actor_type" text NOT NULL,
	"status" text DEFAULT 'started' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"score" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_attempts_test_learner_unique" UNIQUE("test_id","learner_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"max_score" text DEFAULT '100' NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"published" text DEFAULT 'true' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tests_id_workspace_idx" ON "tests" USING btree ("id","workspace_id");