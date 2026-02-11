# Teachers Hub MVP User Stories

## Scope
- Product: Teachers Hub
- MVP focus: Teacher + Student only
- Coverage: KG and all grades
- Multi-tenant foundation: enabled from day 1
- Authentication in MVP: email OTP only

## Teacher Stories

### T1. First Sign-In and School Affiliation
User story:
- As a teacher, I want first sign-in to ask my school affiliation so I can work inside the right school context.

Acceptance criteria:
- First sign-in asks: "Are you part of a school?"
- Teacher can select an existing verified school.
- Teacher can submit a new school request if school is not listed.
- Newly submitted school is not publicly selectable until manual admin verification.
- Selected school is saved as default teacher context.

### T2. Teacher Grade Profile (Grade-Only in MVP)
User story:
- As a teacher, I want to select the grade levels I teach so class setup is faster.

Acceptance criteria:
- Teacher must select one or more grades at onboarding.
- Grade options include KG and all school grades.
- Teacher can update grade levels later in profile settings.
- Subject selection is not required in MVP.

### T3. Class Creation
User story:
- As a teacher, I want to create classes quickly so I can start inviting students.

Acceptance criteria:
- Teacher can create class with name and grade.
- Class appears immediately in teacher dashboard.
- Teacher can only manage classes created/assigned in their school context.

### T4. Roster Import and Pending Students
User story:
- As a teacher, I want to add students manually or by CSV so I do not onboard students one by one.

Acceptance criteria:
- Teacher can add students via form or CSV.
- System creates pending student records.
- Duplicate student email in same class is blocked with clear error.

### T5. Invite Link Generation and Resend
User story:
- As a teacher, I want shareable student invites so students can join with low friction.

Acceptance criteria:
- System generates reusable invite links with expiry.
- Teacher can resend invite from roster.
- Teacher can regenerate invite if expired.
- Invite token is scoped to school and class.

### T6. Manual WhatsApp Share
User story:
- As a teacher, I want to share invites in WhatsApp because many families use it.

Acceptance criteria:
- Teacher can click "Share on WhatsApp" per student or class.
- App opens prefilled WhatsApp message with invite link.
- No automated WhatsApp API sending is required in MVP.

### T7. Test and Quiz Setup
User story:
- As a teacher, I want to create tests/quizzes with clear settings so students can submit online.

Acceptance criteria:
- Teacher can create test title, window, max score, and weight.
- Test is available only to enrolled class students.
- Teacher can view per-student submission state.

### T8. Live Participation Monitor
User story:
- As a teacher, I want real-time test activity so I can follow up with inactive students.

Acceptance criteria:
- Monitor shows states: invited, claimed, signed in, started, submitted, disconnected.
- Status updates are delivered via WebSocket.
- Fallback polling updates states if socket fails.
- Teacher can see last activity timestamp.

### T9. Grade Entry and Safe Publish
User story:
- As a teacher, I want to publish grades safely so I avoid accidental release.

Acceptance criteria:
- Teacher can enter/edit grades for submitted tests.
- Publish requires two-step confirmation.
- Publish and edit actions are audit logged with actor and timestamp.

## Student Stories

### S1. Account Claim and Class Join
User story:
- As a student, I want a simple claim flow so I can join class without technical complexity.

Acceptance criteria:
- Student opens invite link and claims account via email OTP.
- On success, student is auto-assigned to correct class.
- Student cannot join classes outside invite scope.

### S2. Test Participation
User story:
- As a student, I want to take tests in one clear flow so I can submit confidently.

Acceptance criteria:
- Student sees available tests for enrolled classes.
- Student can start and submit within test window.
- Submission confirmation is shown after submit.

### S3. Result Visibility
User story:
- As a student, I want to see my result when teacher publishes so expectations are clear.

Acceptance criteria:
- Student sees results only after teacher publish.
- If not published, status shows pending publication.

## Deferred (Post-MVP) Stories
- Parent onboarding and child linking.
- HoD approval workflow for grade publishing.
- Principal and department dashboards.
- Automated WhatsApp API messaging.
