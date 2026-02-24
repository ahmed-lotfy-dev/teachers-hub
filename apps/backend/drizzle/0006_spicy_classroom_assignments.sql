ALTER TABLE "tests" ADD COLUMN "classroom_id" text;

CREATE TABLE "classrooms" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL,
  "name" text NOT NULL,
  "grade" text NOT NULL,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "classrooms_workspace_name_grade_unique" UNIQUE("workspace_id","name","grade")
);

CREATE TABLE "classroom_students" (
  "id" text PRIMARY KEY NOT NULL,
  "classroom_id" text NOT NULL,
  "workspace_id" text NOT NULL,
  "learner_id" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "classroom_students_classroom_learner_unique" UNIQUE("classroom_id","learner_id")
);

CREATE TABLE "test_assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "test_id" text NOT NULL,
  "workspace_id" text NOT NULL,
  "classroom_id" text NOT NULL,
  "learner_id" text NOT NULL,
  "status" text DEFAULT 'assigned' NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "test_assignments_test_learner_unique" UNIQUE("test_id","learner_id")
);

CREATE INDEX "classrooms_workspace_id_idx" ON "classrooms" USING btree ("workspace_id");
CREATE INDEX "classroom_students_workspace_id_idx" ON "classroom_students" USING btree ("workspace_id");
CREATE INDEX "classroom_students_classroom_id_idx" ON "classroom_students" USING btree ("classroom_id");
CREATE INDEX "test_assignments_test_id_idx" ON "test_assignments" USING btree ("test_id");
CREATE INDEX "test_assignments_workspace_learner_idx" ON "test_assignments" USING btree ("workspace_id","learner_id");
