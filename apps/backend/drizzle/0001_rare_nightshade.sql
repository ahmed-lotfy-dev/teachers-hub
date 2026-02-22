CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"student_name" text,
	"expires_at" timestamp NOT NULL,
	"claimed_at" timestamp,
	"claimed_by_learner_id" text,
	"claimed_by_actor_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_learners" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"actor_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_learners_workspace_learner_unique" UNIQUE("workspace_id","learner_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "invites_token_idx" ON "invites" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "learner_accounts_email_idx" ON "learner_accounts" USING btree ("normalized_email");