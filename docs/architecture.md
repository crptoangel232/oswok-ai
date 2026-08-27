# Oswok AI — Architecture Baseline

## MVP architecture

Oswok uses a modular monolith. The web application is built with Next.js and TypeScript. PostgreSQL, managed through Supabase, is the planned persistence layer. Authentication uses Supabase Auth. Business logic remains independent of the WhatsApp interface.

## Boundaries

- `app/`: routes and server/client UI entry points.
- `components/`: reusable presentation components.
- `lib/`: infrastructure and cross-cutting concerns.
- `services/`: domain services as they are implemented.
- `schemas/`: validated input/output contracts.
- `tests/`: automated tests.

## Security principles

- Never commit secrets.
- Keep server-only credentials out of client bundles.
- Validate untrusted input before business logic.
- Enforce authorisation on the server.
- Use database-level access controls when appropriate.
- Treat AI and messaging payloads as untrusted input.

## Integration strategy

WhatsApp, AI and payments will be added in later phases. They must call interface-independent Oswok services rather than contain core marketplace business logic.
