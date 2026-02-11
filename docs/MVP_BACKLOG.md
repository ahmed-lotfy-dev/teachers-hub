# Teachers Hub MVP Backlog

## Board Setup
- Workspace: `Teachers Hub`
- Board: `Teachers Hub MVP`
- Lists: `Backlog`, `Ready`, `In Progress`, `Review`, `Done`

## Epic E1: Identity and School Context
- `P0` T1. Teacher first sign-in flow with school affiliation prompt
- `P0` T1. Select verified school from directory
- `P0` T1. Submit new school request (pending manual verification)
- `P0` T2. Teacher selects grade levels taught (KG + all grades)
- `P1` T2. Teacher can update grade levels in profile

## Epic E2: Class and Roster Management
- `P0` T3. Create class with name + grade
- `P0` T3. Show class list on dashboard
- `P0` T4. Add students manually to class roster
- `P0` T4. CSV import students to class roster
- `P0` T4. Duplicate student email validation in class

## Epic E3: Invites and Student Claim
- `P0` T5. Generate reusable invite links with expiry
- `P0` T5. Regenerate expired invite link
- `P0` T5. Resend invite from roster
- `P0` T6. Manual WhatsApp share (prefilled message + invite)
- `P0` S1. Student claim via invite link + email OTP
- `P0` S1. Auto-assign student to class from invite scope

## Epic E4: Tests, Submissions, and Monitoring
- `P0` T7. Create test/quiz (title, window, max score, weight)
- `P0` S2. Student sees available tests for enrolled class
- `P0` S2. Student starts and submits test
- `P0` T8. Live monitor state transitions in teacher dashboard
- `P0` T8. WebSocket events for live participation updates
- `P1` T8. Polling fallback when WebSocket disconnects

## Epic E5: Grades and Auditability
- `P0` T9. Teacher grade entry for submitted tests
- `P0` T9. Two-step confirmation before publish
- `P0` S3. Results visible only after teacher publish
- `P0` T9. Audit log for publish and grade edits

## Epic E6: Multi-Tenant Foundation
- `P0` Tenant context middleware on every request
- `P0` School-scoped authorization checks for teacher actions
- `P1` Admin queue view for school verification approvals

## Milestones
- Milestone 1 (Week 1-2): E1 + E2
- Milestone 2 (Week 3-4): E3 + E4 core
- Milestone 3 (Week 5-6): E5 + E6 hardening
- Milestone 4 (Week 7-8): QA, bug fixes, pilot readiness

## Definition of Done (MVP)
- Teacher can onboard, create class, add students, send invites.
- Student can claim account and submit test.
- Teacher can monitor participation in real time.
- Teacher can publish grades with two-step confirmation.
- Core actions are school-scoped and audit logged.
