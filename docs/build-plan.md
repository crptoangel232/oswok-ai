# Oswok AI — MVP Build Plan

## Purpose

This document is the implementation sequence for the Oswok AI MVP. The master specification in `docs/master-spec.md` is the source of truth for product and engineering decisions.

## Build Sequence

1. Engineering foundation
2. Database/schema
3. Authentication and RBAC
4. Admin dashboard
5. Worker system
6. Employer system
7. Job lifecycle
8. Matching engine
9. Reputation
10. WhatsApp integration
11. AI layer
12. Payment recording
13. Notifications
14. Security hardening
15. End-to-end testing
16. Pilot deployment

## Working Rule

Implement one subsystem at a time. Test it before moving to the next subsystem. Do not introduce features outside the master specification unless they are explicitly approved.

## v0 Workflow

For each subsystem:

- Read `docs/master-spec.md`.
- Implement only the requested subsystem.
- Preserve existing architecture.
- Use real working functionality rather than mock-only UI.
- Validate all external/user input.
- Keep secrets server-side.
- Add appropriate tests.
- Run the production build.
- Fix regressions before proceeding.
- Commit the completed work to GitHub.

## Initial Target

The first pilot should focus on Freetown, 3–5 worker categories, approximately 50 workers, 10–20 employers, and at least 20 completed paid jobs.
