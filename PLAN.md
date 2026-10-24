# PLAN — Car Dealership Inventory System

Rules live in `CLAUDE.md`. Each slice below = RED commit, GREEN commit, REFACTOR commit.
Tick a box only when the tests pass and the commits are made. One slice at a time.

## Schedule (IST)
- Sat night, 9:30 pm - 1:00 am: Phase 0 + backend slices 1-6
- Sun 8:00 - 11:00 am: backend slices 7-11, coverage, CI
- Sun 11:00 am - 3:00 pm: frontend
- Sun 3:00 - 5:00 pm: polish + screenshots
- Sun 5:00 - 7:00 pm: README, PROMPTS.md, test report
- Sun 7:00 - 9:00 pm: fresh-clone check, final git log review, SUBMIT (aim for 9 pm, not midnight)
- If behind: cut the optional deploy first, then frontend polish. Never cut tests, README or PROMPTS.md.

## Phase 0 — Setup (30 min)
- [ ] Create PUBLIC GitHub repo; `git init`; add `.gitignore`, `.env.example`
- [ ] Add `CLAUDE.md`, `PLAN.md`, empty `README.md` skeleton, `PROMPTS.md` with a header
- [ ] Scaffold `backend/` (TypeScript, Express, Prisma+SQLite, Jest, Supertest, zod, bcrypt, jsonwebtoken)
- [ ] First commit; run `git log -1` and confirm the Co-Authored-By trailer is present
- [ ] Add this planning chat's public share link to `PROMPTS.md`

## Phase 1 — Backend (strict TDD)
- [x] 1. Health check: `GET /health` returns 200; DB connection test
- [x] 2. Register: 201 + no passwordHash; 400 on bad email or short password; 409 duplicate email; password stored hashed; default role `user`
- [x] 3. Login: 200 + JWT for valid credentials; 401 for wrong password or unknown email
- [ ] 4. Auth middleware + admin guard: 401 without or with bad token; 403 for non-admin on an admin route; seed script creates admin
- [ ] 5. Create vehicle (admin): 201; 400 for missing fields, negative price, non-integer quantity; 401/403 cases
- [ ] 6. List vehicles: 200 returns all including quantity 0; 401 without token
- [ ] 7. Search: each filter alone (make, model, category, price range); combined filters; case-insensitive; empty result is `[]`; invalid price is 400; route not shadowed by `/:id`
- [ ] 8. Update vehicle (admin): 200 with changes; 400 invalid; 404 unknown id; 403 non-admin
- [ ] 9. Delete vehicle (admin): 204; 404 unknown id; 403 non-admin
- [ ] 10. Purchase: decrements by one; 409 at quantity 0; 404 unknown id; 401 without token; two concurrent purchases of the last unit never go below 0
- [ ] 11. Restock (admin): increases quantity; 400 for zero, negative or non-integer; 404; 403 non-admin
- [ ] Coverage report >= 90% on services; save output for the README test report
- [ ] CI: `.github/workflows/ci.yml` runs backend tests (add frontend job later)
- [ ] Final refactor pass: duplicated code, naming, error handling, JSDoc on services

## Phase 2 — Frontend
- [ ] Scaffold Vite + React + TS + Tailwind + Vitest; API client with token handling
- [ ] Auth context + protected routes; register and login forms (tests for validation and error display)
- [ ] Vehicle dashboard: cards/table, loading + empty + error states
- [ ] Search and filter UI (make, model, category, price range) wired to `/api/vehicles/search`
- [ ] Purchase button: disabled at quantity 0; list refreshes after purchase; success/error toast
- [ ] Admin panel: add, edit, delete (with confirm), restock; hidden from non-admins
- [ ] Responsive check at phone, tablet, desktop widths (use Playwright MCP); fix issues
- [ ] Component tests: forms, disabled Purchase, admin gate; add frontend job to CI

## Phase 3 — Documentation and delivery
- [ ] Screenshots: login, dashboard, search, admin panel, mobile view -> `docs/screenshots/`
- [ ] README: overview, setup (backend + frontend), env vars, seeded admin credentials, API summary, assumptions (list returns qty 0; admin for all writes; purchase = 1 unit)
- [ ] README: test report (coverage output + test counts) for backend and frontend
- [ ] README: "My AI Usage" in MY OWN words: tools (Claude Code, plugins used), how, honest reflection
- [ ] `/export` every Claude Code session to `prompts/session-N.md`; assemble raw `PROMPTS.md` (logs + public chat links), no summaries
- [ ] Optional (only if everything above is done): deploy with Postgres and add the live link

## Phase 4 — Final checks (before submitting)
- [ ] Clone the repo into a fresh folder; follow the README exactly; app and tests run
- [ ] `git log --oneline`: visible test -> feat -> refactor pattern; AI commits have the co-author trailer
- [ ] Repo is public; no `.env` or secrets committed; `.env.example` present
- [ ] I can explain every file in an interview (architecture, auth flow, atomic purchase, why TDD slices)
- [ ] Submit the repo link before the deadline

## Decisions log
- Stack: Node + TS + Express + Prisma/SQLite; React + Tailwind frontend. Change here first if it changes.
- Frontend style: dark theme via the bugatti-design-analysis skill, plus semantic status colors; no Bugatti branding.
- Open questions: (none yet)
