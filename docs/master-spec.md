# OSWOK AI — Master Technical Specification

**Product:** Oswok AI  
**Version:** MVP / v1.0  
**Primary interface:** WhatsApp  
**Management interface:** Responsive web dashboard  
**Initial market:** Sierra Leone  
**Initial geography:** Freetown

## 1. Product Definition

Oswok AI is a WhatsApp-first platform that helps people find trustworthy work opportunities and helps employers find suitable workers.

The MVP objective is to facilitate real, trusted, paid work between workers and employers.

Oswok is a technology platform that coordinates workers and employers. It is not initially an employer, bank, legal representative, or financial institution.

## 2. Core Transaction

`Worker → Profile → Job → Match → Employer → Acceptance → Work → Payment confirmation → Reputation`

## 3. MVP Users

- Worker
- Employer
- Admin
- Super Admin

## 4. MVP Systems

1. Worker system
2. Employer system
3. Job system
4. Matching engine
5. WhatsApp conversational interface
6. Admin dashboard
7. Reputation and transaction system

## 5. Worker Journey

WhatsApp → Registration → Profile → Skills → Location → Availability → Verification → Job opportunities → Acceptance → Completion → Payment confirmation → Review

Worker data should include phone, name, location, skills, experience, availability, preferred work areas, expected rate/range, and verification status. Collect only information required for the MVP.

## 6. Employer Journey

Registration → Verification → Job creation → Matching → Candidate selection → Worker acceptance → Work → Completion → Payment confirmation → Review

## 7. Job Model

A job contains: job ID, employer, category, description, required skills, location, date, time/duration, number of workers, budget/rate, requirements, status, created timestamp, and expiry timestamp.

Natural-language job requests may be converted to structured fields by AI, but the extracted information must be validated and confirmed before publication.

## 8. Job Lifecycle

`DRAFT → OPEN → MATCHED → ACCEPTED → IN_PROGRESS → COMPLETED → PAYMENT_CONFIRMED → REVIEWED`

Alternative states: `CANCELLED`, `EXPIRED`, `DISPUTED`, `SUSPENDED`.

Invalid state transitions must be rejected server-side.

## 9. Matching Engine

Initial explainable score:

- Skill compatibility: 30%
- Location proximity: 20%
- Availability: 20%
- Experience: 10%
- Reliability: 10%
- Rating: 10%

Workers who are unavailable, suspended, banned, missing required skills, or otherwise disqualified by business rules must not be recommended.

The matching system should explain recommendations in human-readable terms.

## 10. AI Layer

AI may be used for natural-language extraction, skill extraction, job classification, profile assistance, conversational search, semantic matching signals, and risk/fraud assistance.

AI must not independently approve high-risk payments, grant privileges, permanently ban users, alter financial records, or override verification/security controls.

AI output is untrusted input. Use structured output, schema validation, business-rule validation, then authorised services before database writes.

## 11. WhatsApp Architecture

`Worker → WhatsApp Business Platform → Webhook → Oswok API → Conversation Service → Business Logic → Database`

WhatsApp is an interface, not the core system. Business logic must remain interface-independent so future web, mobile, SMS, USSD, or voice interfaces can be added.

## 12. Admin Dashboard

Required areas: overview, workers, employers, jobs, matches, disputes, verification, transactions, support, analytics, and audit logs.

Administrators must be able to manually intervene in matching, verification, disputes, and suspicious activity.

## 13. Reputation

Track jobs accepted, jobs completed, cancellations, no-shows, disputes, ratings, and repeat transactions. Do not rely only on star ratings.

Example reliability profile:

`Jobs completed | Completion rate | No-shows | Cancellations | Disputes | Average rating`

Users need a dispute mechanism for contested reviews or transactions.

## 14. Payments

MVP may record expected amount, payment method, payment status, payment confirmation, and timestamp. Direct settlement between employer and worker may be used initially where appropriate.

Oswok should not hold customer funds or operate escrow until appropriate legal, contractual, regulatory, and technical requirements have been established.

## 15. Verification

Progressive levels:

- Level 0: Unverified
- Level 1: Phone verified
- Level 2: Identity/profile manually reviewed
- Level 3: Additional evidence such as references, certificates, or previous work

The UI must distinguish verified information from self-declared information.

## 16. Security

Required controls include HTTPS/TLS, secure authentication, server-side authorisation, RBAC, secure sessions, MFA for administrators, protected secrets, webhook verification, input validation, rate limiting, audit logs, database access controls, backups, dependency monitoring, security headers, CSRF protection where applicable, SQL injection protection, XSS protection, IDOR/BOLA protection, privilege escalation prevention, and abuse detection.

High-risk actions should require additional verification. WhatsApp must not be treated as the sole trusted identity layer for sensitive operations.

AI security must address prompt injection, instruction hijacking, data exfiltration, tool abuse, and sensitive-data leakage. AI must use least privilege and must not receive unrestricted database/system access.

## 17. Privacy

Collect the minimum data required. Do not expose private identifiers or sensitive documents unnecessarily. Establish privacy policy, retention, deletion, and access procedures before public launch.

## 18. Database

Initial relational entities:

`users`, `worker_profiles`, `employer_profiles`, `skills`, `worker_skills`, `worker_availability`, `jobs`, `job_requirements`, `job_matches`, `applications`, `transactions`, `reviews`, `disputes`, `support_tickets`, `notifications`, `conversations`, `messages`, `verification_records`, `audit_logs`.

## 19. Technology Stack

- Frontend: Next.js, React, TypeScript
- UI: Tailwind CSS, shadcn/ui
- Backend: Next.js server-side/API layer initially
- Database: PostgreSQL, preferably managed through Supabase for MVP
- Authentication: Supabase Auth or equivalent secure provider
- AI: provider-agnostic AI service abstraction, initially using a leading LLM API
- Messaging: WhatsApp Business Platform / Cloud API
- Hosting: Vercel
- Source control: GitHub
- Monitoring: application logs, error tracking, audit logs, performance monitoring

Use a modular monolith for MVP. Do not begin with microservices.

## 20. Project Structure

```text
oswok/
├── app/
│   ├── dashboard/
│   ├── workers/
│   ├── employers/
│   ├── jobs/
│   ├── disputes/
│   └── api/
├── components/
├── lib/
│   ├── auth/
│   ├── database/
│   ├── whatsapp/
│   ├── ai/
│   ├── matching/
│   ├── reputation/
│   ├── payments/
│   └── security/
├── services/
├── schemas/
├── tests/
└── docs/
```

## 21. API Boundaries

Suggested routes:

`/api/auth`, `/api/workers`, `/api/employers`, `/api/jobs`, `/api/matches`, `/api/applications`, `/api/reviews`, `/api/disputes`, `/api/payments`, `/api/notifications`, `/api/whatsapp`, `/api/ai`, `/api/admin`.

Every sensitive endpoint must enforce authentication, authorisation, input validation, resource ownership, and valid state transitions server-side.

## 22. Notifications

Support worker and employer notifications for registration, verification, jobs, matches, selection, acceptance, reminders, completion, reviews, disputes, and relevant payment events.

## 23. Analytics

Track events including `USER_REGISTERED`, `PROFILE_COMPLETED`, `WORKER_VERIFIED`, `EMPLOYER_REGISTERED`, `JOB_CREATED`, `JOB_PUBLISHED`, `MATCH_CREATED`, `MATCH_ACCEPTED`, `JOB_STARTED`, `JOB_COMPLETED`, `PAYMENT_CONFIRMED`, `REVIEW_SUBMITTED`, `DISPUTE_CREATED`, and `DISPUTE_RESOLVED`.

Primary metric: completed paid jobs facilitated by Oswok.

## 24. Initial Market

Launch initially in Freetown with approximately three to five worker categories. Suggested categories: cleaning, event support, domestic services, technicians, and freelance/digital services.

The system should be configurable for later expansion to other districts.

## 25. MVP Exclusions

Do not build into v1: full mobile app, social feed, lending, insurance, cryptocurrency, blockchain, advanced wallet, large e-learning platform, nationwide deployment, automated high-value payments, unrestricted autonomous AI agents, predictive employment scoring, facial recognition, biometric identification, political profiling, or unnecessary sensitive-data collection.

## 26. Concierge MVP

Human intervention is intentionally supported. Early jobs may be manually reviewed, matched, verified, or resolved by administrators. Automation should follow observed workflows rather than assumptions.

## 27. Acceptance Criteria

Worker can register through WhatsApp, create a profile, add skills, set availability, receive a suitable job, accept it, complete it, confirm payment, and receive a review.

Employer can register, create a job, receive candidate matches, select a worker, confirm completion/payment, and review the worker.

Admin can view and verify users, manage jobs and matches, intervene in workflows, handle disputes, view transactions, and inspect audit logs.

## 28. Pilot

Initial target: approximately 50 workers, 10–20 employers, 3–5 categories, Freetown, and at least 20 completed paid jobs.

The pilot should optimise for learning and transaction quality rather than registrations or downloads.

## 29. Monetisation Hypotheses

Potential future models include employer fees, transaction commissions where legally and commercially appropriate, employer subscriptions, organisation plans, and optional premium worker services. Do not lock the monetisation model before validating willingness to pay.

## 30. Long-Term Direction

If the core marketplace succeeds, Oswok may evolve from job matching into a broader economic coordination platform:

`Learn → Prove Skills → Find Work → Complete Work → Get Paid → Build Reputation → Access Better Opportunities`

The long-term strategic asset is the trusted economic network, not the chatbot.

## 31. Development Rules

Build incrementally. Every major subsystem must preserve this specification, avoid unrelated changes, use real functionality, validate input, handle errors, protect secrets, and include tests where appropriate.

Recommended sequence:

1. Architecture
2. Database
3. Authentication/RBAC
4. Admin dashboard
5. Worker system
6. Employer system
7. Jobs
8. Matching
9. Reputation
10. WhatsApp
11. AI
12. Payment recording
13. Notifications
14. Security hardening
15. End-to-end testing
16. Pilot deployment

## 32. Definition of Done

A feature is complete only when its frontend, backend, database operations, authentication, authorisation, validation, error handling, loading/empty states, relevant logging, security review, tests, and production build are functional.

## 33. Master Engineering Rule

**Do not build what has not been validated. Build the smallest system capable of producing a genuine economic transaction, observe it, measure it, improve it, automate it, and then scale it.**
