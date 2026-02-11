# Product Requirements Document (PRD)
# Teachers Hub (Teacher-First MVP)

> Version: 0.4 Draft
> Date: February 11, 2026
> Status: Working Draft
> Author: Codex + Product Owner

---

## 1. Executive Summary

Product name: Teachers Hub

Teachers Hub is a teacher-first platform for class setup, student onboarding, tests/quizzes, grading, and live participation tracking across KG and all grade levels. MVP is intentionally simple and can run in teacher-led mode first, then expand to full multi-school multi-tenant SaaS with admin/HoD/principal roles.

---

## 2. Problem Statement

Teachers need a simple workflow to:
- create classes quickly,
- onboard students with minimal friction,
- run tests and publish grades,
- monitor who is active during assessments,
- follow up with students/parents who did not complete onboarding.

Existing tools are often too complex for this daily flow.

---

## 3. Product Goals

Primary goals:
1. Ship a usable teacher-only MVP fast.
2. Keep onboarding low-friction for low-tech users.
3. Provide real-time test participation visibility.
4. Keep architecture extensible for multi-school roles later.
5. Validate value with pilot teachers before role expansion.

Non-goals for MVP:
- Full school ERP/SIS replacement.
- SMS OTP.
- Automated WhatsApp API messaging.

---

## 4. MVP Roles and Access

### 4.1 MVP Roles
1. Teacher (Primary Owner)
- Create/manage classes.
- Import student roster.
- Create/publish tests and grades.
- Monitor and follow up on student activity.

2. Student
- Join class via invite link + email OTP claim.
- Take tests and view own results.

### 4.2 Expansion Roles (Later)
- School Admin, Parent, HoD, Principal.

---

## 5. Core MVP Scope

### 5.1 Teacher + School Affiliation Onboarding
- On first teacher sign-in, ask: "Are you part of a school?"
- If yes, teacher chooses an existing verified school profile or submits a new school profile for verification.
- Teacher must select grade level(s) they teach (KG and/or grade bands).
- Selected school is stored as teacher's default tenant context.
- Newly submitted schools stay private pending verification and appear for future teacher signups/sign-ins only after manual admin approval.

### 5.2 Class and Student Enrollment
- Teacher creates class.
- Teacher imports student roster (CSV/manual).
- System creates pending student records.
- System generates invite links.
- Student claims via email OTP and is auto-assigned to class.

### 5.3 Tests and Gradebook
- Teacher creates tests/quizzes (title, date window, max score, weight).
- Students submit in class scope.
- Teacher publishes grades.
- Grade edits are audited.

### 5.4 Real-Time Participation Monitor
Teacher dashboard shows per student status:
- onboarding: not invited, invited, link opened, claimed, active
- test: signed in, started, submitted, timed out/disconnected

Delivery method:
- WebSocket real-time updates
- polling fallback if socket disconnects

### 5.5 Invite and Communication UX
- Reusable invite links until expiry.
- Frictionless claim (magic link + email OTP).
- One-click invite resend.
- Manual WhatsApp share with prefilled message (no API automation in MVP).

---

## 6. Functional Requirements (MVP)

- F-001: Teacher account and secure authentication.
- F-002: School affiliation step on first sign-in (select/create school).
- F-003: Persist teacher default school context for future sessions.
- F-003a: Capture teacher grade level(s) at onboarding and allow later profile updates.
- F-004: Verified school directory listing for teacher signup/sign-in flows.
- F-004a: New school submissions require manual admin verification before being listed publicly.
- F-005: Class creation and class settings.
- F-006: Student roster import and pending states.
- F-007: Secure invite issuance with expiry.
- F-008: Email OTP account claim flow.
- F-009: Auto-assignment to class from invite token.
- F-010: Test creation, submission, and grade publishing.
- F-011: WebSocket activity events (signin/start/submit/disconnect).
- F-012: Invite resend and link regeneration.
- F-013: Audit log for invite, claim, test, and grade events.

---

## 7. Non-Functional Requirements

- Security: signed tokens, expiry windows, auditability.
- Security: tenant-safe data access by school context.
- Performance: near-real-time monitor updates for active tests.
- Reliability: socket reconnect with fallback polling.
- Localization: Arabic + English.
- Cost control: email OTP only.

---

## 8. Success Metrics (First 90 Days)

1. 80% of pilot teachers run at least one test through platform.
2. 70% of invited students claim accounts.
3. <5 minutes median invite-click to class-join time.
4. 90% of submissions appear in monitor within seconds.
5. 50% reduction in teacher follow-up effort for inactive students.

---

## 9. Delivery Plan

Phase 1 (6-8 weeks):
- Teacher-only core: school affiliation onboarding, classes, invites, email OTP, tests, live monitor.

Phase 1.5 (2-4 weeks):
- Parent role, child linking, progress notifications for lower grades first.

Phase 2:
- School Admin + HoD + Principal roles, approval workflows, multi-school tenancy hardening.
- Parent access expanded to all grades.

---

## 10. Locked Decisions

1. MVP mode: teacher-first, minimal roles.
2. Onboarding auth: email OTP only (no SMS OTP yet).
3. Activity tracking: real-time via WebSocket + fallback polling.
4. Messaging rollout: manual WhatsApp share first.
5. Invite policy: reusable invite link until expiry.
6. Grade publish UX in MVP: two-step teacher confirmation before publish.
7. Grade policy target: approval-required when school roles are enabled.
8. Future school mode default grade approver: HoD.
9. Multi-tenant provisioning timing: implement now (school-ready foundation from day 1).
10. First sign-in flow includes school selection/creation and saved school context.
11. School creation policy: manual admin verification required before public listing.
12. Parent rollout: Phase 1.5 for lower grades, full all-grades rollout in Phase 2.
13. Product coverage: KG and all grades are supported in the core model from MVP onward.
14. Teacher onboarding captures grade level(s) only in MVP (subject selection deferred).

---

## 11. Open Decisions

- None (current PRD scope decisions are locked).


