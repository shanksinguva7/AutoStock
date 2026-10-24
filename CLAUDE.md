# Car Dealership Inventory System — Project Rules

Full-stack TDD kata for Incubyte (Software Craftsperson internship). Deadline: Sunday 25 Oct 2026, night.
Graders read the git history, the tests, the README and PROMPTS.md. Quality of process matters as much as the app.

## Stack
- Backend: Node.js + TypeScript + Express, SQLite via Prisma (a real file DB, never in-memory for the app), JWT auth, bcrypt, zod validation.
- Backend tests: Jest + Supertest. Tests use a separate SQLite file (`test.db`), reset between tests.
- Frontend: Vite + React + TypeScript, Tailwind CSS, Vitest + React Testing Library.
- Layout: `backend/`, `frontend/`, root `README.md`, `PROMPTS.md`, `PLAN.md`, `prompts/`.

## Working agreement
1. Read `PLAN.md` first. Work on ONE unchecked slice at a time, then stop and tell me what changed.
2. Work in a single thread on a single branch. No git worktrees, no parallel subagents (keeps history linear).
3. Skip long brainstorming. The plan and decisions below are already settled. Ask only if something is truly ambiguous.
4. Do not copy code from other repositories. Everything must be written for this project.
5. Keep changes small. Do not touch files unrelated to the current slice.

## TDD rules (non-negotiable)
Every behavior follows Red -> Green -> Refactor, with THREE separate commits:
1. RED: write the failing test, run it, show me the failing output, commit `test(scope): ...`.
2. GREEN: write the minimum code to pass, run all tests, commit `feat(scope): ...` (or `fix`).
3. REFACTOR: clean up with tests green, commit `refactor(scope): ...`. Skip only if nothing needs cleaning.
- Never write production code before a failing test exists for it.
- Test names describe behavior ("returns 409 when stock is zero"), not implementation.
- Cover happy path, validation errors, auth (401/403), not-found (404) and edge cases.
- Target 90%+ coverage on backend services. Run `npm test -- --coverage` at the end of each phase.

## Commit rules
- Conventional prefixes: `test`, `feat`, `fix`, `refactor`, `docs`, `chore`, `ci`.
- Subject under 72 chars, imperative. Body explains what the AI did vs what I changed, when useful.
- KEEP the `Co-Authored-By` trailer Claude Code adds. The kata requires AI co-authorship on every AI-assisted commit. Never strip it or disable attribution.
- Commit after every red, green and refactor step. Never batch a whole feature into one commit.

## Architecture and clean code
- Layers: routes -> controllers -> services -> repositories. Controllers only parse HTTP; services hold business rules; repositories talk to the DB.
- Follow SOLID. Inject dependencies (repositories into services) so services are unit-testable with fakes.
- Clear names, small functions, no magic numbers, no dead code. Comment the WHY, add JSDoc on public service methods.
- Central error handling: custom error classes mapped to HTTP status in one middleware.
- Secrets in `.env` (git-ignored). Provide `.env.example`.

## API decisions (already settled, document them in README)
- Vehicle: `id`, `make`, `model`, `category`, `price` (number >= 0), `quantity` (integer >= 0).
- User: `id`, `email` (unique), `passwordHash`, `role` (`user` | `admin`, default `user`). A seed script creates one admin; demo credentials go in README.
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST/GET /api/vehicles`, `GET /api/vehicles/search`, `PUT/DELETE /api/vehicles/:id`, `POST /api/vehicles/:id/purchase`, `POST /api/vehicles/:id/restock`.
- All `/api/vehicles*` routes require a valid JWT. Admin only: POST, PUT, DELETE vehicles and restock. (Spec only marks delete/restock; we choose admin for all writes to match the admin UI. Document this.)
- `GET /api/vehicles` returns ALL vehicles including quantity 0, so the UI can show a disabled Purchase button.
- Define `/search` BEFORE `/:id` in the router.
- Search params: `make`, `model`, `category` (case-insensitive contains), `minPrice`, `maxPrice`; all optional and combinable. No match returns 200 with `[]`. Bad numbers return 400.
- Purchase buys one unit, done as a single atomic conditional decrement. Quantity 0 returns 409. Restock needs a positive integer.
- Status codes: 201 created, 400 validation, 401 missing/invalid token or bad login, 403 not admin, 404 not found, 409 conflict (duplicate email, out of stock).
- Never return `passwordHash`.

## Frontend rules
- Pages: register, login, vehicle dashboard (search + filters, Purchase button disabled at quantity 0), admin panel (add, edit, delete, restock).
- Tailwind only, mobile-first, responsive, visible loading/error/empty states. Store the JWT carefully and attach it in one API client module.
- Hide admin UI for non-admins (the backend still enforces roles).
- Write component tests for forms, the disabled Purchase button and the admin gate.

## Docs and AI transparency
- README sections: overview, features, tech stack, local setup (backend + frontend), env vars, seeded admin login, API summary, assumptions, screenshots, test report, "My AI Usage".
- "My AI Usage" is written by ME in my own words (tools used, how, reflection). Do not auto-generate it.
- `PROMPTS.md` holds RAW, unedited chat logs or public chat links. Never summarize, rewrite or "clean up" it.
- CI: GitHub Actions workflow runs backend and frontend tests on every push.
