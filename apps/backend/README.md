# Teachers Hub Backend API

## Base URLs
- API base: `http://localhost:8000/api`
- Versioned alias: `http://localhost:8000/api/v1`
- OpenAPI UI: `http://localhost:8000/api/docs`
- OpenAPI JSON: `http://localhost:8000/api/docs/json`

## Run
```bash
bun run dev
```

## Versioning
- Canonical endpoints are under `/api/*`.
- `/api/v1/*` is supported as alias and redirects to `/api/*` using `308`.

## Route Catalog

### System
- `GET /`
- `GET /health`
- `GET /api`
- `GET /api/csrf`

### Auth
Mounted Better Auth routes:
- `/api/auth/*`

### Onboarding
- `GET /api/onboarding/schools`
  - Query params:
  - `q` (optional)
- `POST /api/onboarding/schools`
- `POST /api/onboarding/teacher`
- `GET /api/onboarding/teacher/me`

### Invites
- `POST /api/invites`
- `GET /api/invites/:token`
- `POST /api/invites/:token/claim`

### Classrooms (Teacher)
- `GET /api/classrooms?workspaceId=...`
  - List teacher classrooms with `activeStudentCount`.
- `POST /api/classrooms/create`
  - Body example:
  ```json
  {
    "workspaceId": "ws_123",
    "name": "KG Stars",
    "grade": "KG"
  }
  ```
- `GET /api/classrooms/workspace-students?workspaceId=...`
  - List workspace students available for assignment.
- `GET /api/classrooms/:classroomId/students?workspaceId=...`
  - List class roster.
- `POST /api/classrooms/:classroomId/students`
  - Body example:
  ```json
  {
    "workspaceId": "ws_123",
    "learnerId": "lrn_456"
  }
  ```

### Tests (Teacher)
- `POST /api/tests/create`
  - Creates draft test for a class.
  - Body example:
  ```json
  {
    "workspaceId": "ws_123",
    "classroomId": "cls_123",
    "title": "Math Quick Check",
    "description": "10-minute arithmetic readiness test.",
    "maxScore": 100
  }
  ```
- `GET /api/tests/teacher?workspaceId=...`
  - List teacher tests with class metadata.
- `POST /api/tests/:testId/validate`
  - Body: `{ "workspaceId": "ws_123" }`
- `POST /api/tests/:testId/publish`
  - Body: `{ "workspaceId": "ws_123" }`
  - On publish: creates assignments for all active students in class.
- `GET /api/tests/:testId/attempts?workspaceId=...`
  - Returns assigned children and attempt/submission status for dashboard monitoring.

### Tests (Builder)
- `POST /api/tests/bank`
- `GET /api/tests/bank`
  - Query params:
  - `workspaceId` (required)
  - `grade`, `subject`, `topic`, `skill`, `type`, `difficulty`, `status` (optional)
- `POST /api/tests/:testId/questions`
- `GET /api/tests/:testId/questions?workspaceId=...`

### Tests (Learner App Flow)
- `GET /api/tests?workspaceId=...&learnerId=...&actorType=student|parent`
- `POST /api/tests/:testId/start`
- `POST /api/tests/:testId/submit`

### Tests (Public Link, Low Friction)
These are for non-technical parent/student entry from shared link:
- `GET /api/tests/public/:testId`
  - Returns public-safe test info.
- `POST /api/tests/public/:testId/start`
  - Body example:
  ```json
  {
    "childName": "Mariam Ahmed"
  }
  ```
  - Resolves assigned learner by child name and starts attempt.
- `POST /api/tests/public/:testId/submit`
  - Body example:
  ```json
  {
    "attemptId": "attempt_123"
  }
  ```

### Integrations: Microsoft Teams
- `POST /api/integrations/teams/list`
- `POST /api/integrations/teams/import`

## Query Parameter Quick Reference
- `/api/onboarding/schools`
  - `q`
- `/api/classrooms`
  - `workspaceId`
- `/api/classrooms/workspace-students`
  - `workspaceId`
- `/api/classrooms/:classroomId/students`
  - `workspaceId`
- `/api/tests/teacher`
  - `workspaceId`
- `/api/tests/:testId/attempts`
  - `workspaceId`
- `/api/tests`
  - `workspaceId`, `learnerId`, `actorType`
