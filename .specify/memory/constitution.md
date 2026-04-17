<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Modified principles: N/A — initial fill from template placeholders
Added sections:
  - I. Server-First Architecture
  - II. Strict Type Safety
  - III. Security & Authentication (NON-NEGOTIABLE)
  - IV. Test-First Development (NON-NEGOTIABLE)
  - V. Data Integrity & API Design
  - Technology Stack & Tooling
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/memory/constitution.md — updated (this file)
  ✅ .specify/templates/plan-template.md — Constitution Check section aligns (no update needed)
  ✅ .specify/templates/spec-template.md — Requirements/Functional Requirements aligns (no update needed)
  ✅ .specify/templates/tasks-template.md — task phases align with principles (no update needed)
  ℹ️  .specify/templates/commands/ — directory empty, no command files to audit
Follow-up TODOs:
  - None. All placeholders resolved.
-->

# VBucks Shop Constitution

## Core Principles

### I. Server-First Architecture

Next.js Server Components MUST be the default. Client Components are only permitted
when browser interactivity is genuinely required (event handlers, browser APIs, stateful
UI). Business logic MUST live in `/services` or `/lib`, never inside components.
Mutations MUST go through API routes only — never fire directly from Client Components.

Folder layout is non-negotiable:
- `/app` — routing and layouts (Next.js App Router)
- `/components` — reusable UI only; zero business logic
- `/lib` — utility functions and third-party client initialisation (Supabase, Clerk)
- `/services` — all business logic
- `/types` — shared TypeScript types (`types/index.ts` is the single source of truth)

Import paths MUST use the `@/` alias. Relative imports (e.g. `../../lib/x`) are
forbidden.

**Rationale**: Keeps the client bundle minimal, protects sensitive logic server-side,
and enforces a predictable layer boundary that scales without re-architecture.

### II. Strict Type Safety

TypeScript strict mode is mandatory across the entire codebase. `any` is banned; if
unavoidable an explanatory comment MUST accompany it. The non-null assertion operator
(`!`) is banned without an explanatory comment justifying why null is impossible at that
point.

All shared types MUST be declared in `types/index.ts`. Local type redefinitions of
existing shared types are forbidden.

**Rationale**: Untyped or loosely typed code in a payments/auth context creates silent
data bugs and security edge cases. Strict types make contract violations compile-time
errors.

### III. Security & Authentication (NON-NEGOTIABLE)

Every API route MUST follow this exact validation order:
1. Verify user identity via Clerk server-side (never trust client-supplied auth state).
2. Validate and sanitise all inputs.
3. Execute business logic.

Only `NEXT_PUBLIC_` prefixed environment variables are permitted to reach the browser.
All other secrets (Supabase service key, Stripe secret key, Resend API key, Clerk
secret) MUST remain server-side exclusively.

**Rationale**: Payments and account balance mutations are irreversible. Authentication
bypass or secret exposure could result in financial fraud or account takeover.

### IV. Test-First Development (NON-NEGOTIABLE)

Every new feature MUST ship with at least one unit test covering its core logic. Every
user-facing flow MUST have a corresponding E2E test. Tests MUST be written before or
alongside the implementation — not deferred as a follow-up.

Tests MUST cover: happy path, auth failure path, and invalid-input path for every API
route.

**Rationale**: The admin-gifting flow and Stripe webhooks cannot be manually exercised
in every PR. Automated tests are the only safety net preventing regressions from
reaching production.

### V. Data Integrity & API Design

Supabase (Postgres) is the single source of truth. Row Level Security (RLS) MUST be
enabled on all tables. Sensitive queries (balance reads, purchase history, admin
operations) MUST only execute on the server.

Stripe webhook handlers MUST be idempotent. VBucks balance mutations MUST be wrapped
in database transactions to prevent partial updates.

Server Actions are preferred over API routes for form submissions and mutations that do
not require a webhook or external callback. API routes remain appropriate for Stripe
webhooks and Clerk webhooks.

**Rationale**: Client-side data fetching bypasses RLS and exposes financial data.
Non-idempotent webhook handlers cause double-credits or missed deliveries.

## Technology Stack & Tooling

**Runtime**: Next.js 16 (App Router) on Vercel
**Language**: TypeScript (strict mode)
**Styling**: Tailwind CSS — utility-first; no custom CSS files unless Tailwind cannot
express the requirement
**Auth**: Clerk — session management, route protection, user metadata
**Database**: Supabase (Postgres) with RLS; migrations managed via Supabase CLI
**Payments**: Stripe — checkout sessions, webhooks for fulfilment
**Email**: Resend — transactional email for admin skin-gift notifications
**Testing**: As specified in `docs/TESTING.md`

All stack changes MUST be reflected in `AGENTS.md` and `docs/` before merging.

## Development Workflow & Quality Gates

**Pull Request gates** — a PR MUST NOT merge if:
- Any TypeScript compilation error exists (`tsc --noEmit` fails)
- Any unit or E2E test fails
- `any` or bare `!` added without an explanatory comment
- Business logic added to a Client Component
- A secret is exposed client-side
- A relative import (`../../`) introduced

**Domain docs** — before touching a domain read the governing doc:
- `docs/DATABASE.md` for schema or query changes
- `docs/AUTH.md` for Clerk or route-protection changes
- `docs/PAYMENTS.md` for Stripe flow or webhook changes
- `docs/TESTING.md` for testing strategy changes

**Complexity justification** — any deviation from standard patterns (e.g., caching
layer, third service, non-standard auth flow) MUST be documented in the relevant
`specs/` plan under a Complexity Tracking section before implementation begins.

## Governance

This constitution supersedes all other informal practices and verbal agreements. It is
the authoritative statement of non-negotiable rules for the VBucks Shop project.

**Amendment procedure**:
1. Open a PR that edits `.specify/memory/constitution.md` directly.
2. Bump the version according to semantic rules (see below).
3. Describe the change and rationale in the PR description.
4. At least one other contributor MUST approve before merging.
5. After merge, update any affected `docs/` files and templates within the same PR.

**Version semantics**:
- MAJOR: Removal or incompatible redefinition of an existing principle.
- MINOR: New principle, section, or materially expanded guidance added.
- PATCH: Clarification, wording, or non-semantic refinement.

**Compliance**: All PRs and code reviews MUST verify adherence to this constitution.
Violations that cannot be immediately fixed MUST be tracked as issues before the PR
merges.

**Version**: 1.0.0 | **Ratified**: 2026-04-17 | **Last Amended**: 2026-04-17
