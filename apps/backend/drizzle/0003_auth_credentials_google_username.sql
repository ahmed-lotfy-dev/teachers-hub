ALTER TABLE "users" ADD COLUMN "username" text;
ALTER TABLE "users" ADD COLUMN "display_username" text;
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DEFAULT false;
UPDATE "users" SET "email_verified" = false WHERE "email_verified" IS NULL;
ALTER TABLE "users" ALTER COLUMN "email_verified" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" USING btree ("username");

ALTER TABLE "sessions" ADD COLUMN "ip_address" text;
ALTER TABLE "sessions" ADD COLUMN "user_agent" text;
ALTER TABLE "sessions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "sessions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "accounts" ADD COLUMN "access_token" text;
ALTER TABLE "accounts" ADD COLUMN "refresh_token" text;
ALTER TABLE "accounts" ADD COLUMN "id_token" text;
ALTER TABLE "accounts" ADD COLUMN "access_token_expires_at" timestamp;
ALTER TABLE "accounts" ADD COLUMN "refresh_token_expires_at" timestamp;
ALTER TABLE "accounts" ADD COLUMN "scope" text;
ALTER TABLE "accounts" ADD COLUMN "password" text;
ALTER TABLE "accounts" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "accounts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "verification_tokens" ADD COLUMN "id" text;
UPDATE "verification_tokens" SET "id" = md5(random()::text || clock_timestamp()::text || coalesce("identifier", '') || coalesce("token", '')) WHERE "id" IS NULL;
ALTER TABLE "verification_tokens" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "verification_tokens" ADD PRIMARY KEY ("id");
ALTER TABLE "verification_tokens" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "verification_tokens" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
