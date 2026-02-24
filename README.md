# Teachers Hub Monorepo

Teachers Hub is a Bun workspace monorepo with:
- `apps/backend`: Bun + Elysia API
- `apps/frontend`: Vite + React teacher + parent/student UI

## Core Product Flow (Current)
1. Teacher onboards and gets a workspace.
2. Teacher creates classes and assigns workspace students to each class.
3. Teacher creates a test for a class.
4. Teacher publishes the test.
5. Publish assigns that test to all active students in the selected class.
6. Teacher can open a per-test dashboard page and share a simple public link.
7. Parent/student opens the link, types child name, starts/submits test.
8. Attempt/submission appears in teacher test dashboard.

## Local Commands
- `bun install`
- `bun run dev`
- `bun run build`
- `bun run typecheck`

## Backend API + Docs
- API base: `/api`
- Version alias: `/api/v1` (redirects to canonical `/api`)
- OpenAPI UI: `/api/docs`
- OpenAPI JSON: `/api/docs/json`

Detailed API route catalog is in:
- `apps/backend/README.md`

## Docker + Single Domain
- Compose file: `docker-compose.yml`
- Public service: `frontend` (Nginx)
- Internal service: `backend` (Elysia)
- API is proxied under the same domain via `/api/*`

## Required Environment Variables
- `PUBLIC_URL` (example: `https://teachers.example.com`)
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- Google auth (optional but supported):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

## Run Compose
```bash
docker compose up --build
```

Dokploy note:
- map your domain to the `frontend` service on port `80`.
