# AutoStock — Car Dealership Inventory System

## Overview

AutoStock is a full-stack inventory app for a car dealership. Signed-in users browse and search the stock and buy vehicles one unit at a time. Admins add, edit, delete and restock vehicles. The backend is a REST API (Express + Prisma on SQLite) with JWT auth; the frontend is a React single-page app.

It was built as a TDD kata: every behavior went in as a failing test, then the code to pass it, then a refactor, each as its own commit. `git log --oneline` shows the `test` → `feat` → `refactor` rhythm.

## Features

**Everyone (signed in)**
- Register and log in; the session survives a page reload and logout clears it.
- Vehicle dashboard with loading, empty and error (with retry) states.
- Search by make, model and category (partial, case-insensitive) and by min/max price; filters combine, blank filters are ignored, and Clear shows the whole list again.
- Purchase one unit. The button is disabled and reads "Out of stock" at quantity 0. The list refreshes after every purchase, and the result shows as a success or error toast.

**Admins only**
- An Admin link and `/admin` page that other users never see (the route redirects them to the dashboard).
- Add and edit vehicles with the same validation rules as the API.
- Delete with an inline confirmation step.
- Restock by a positive whole number of units.

**Under the hood**
- Layered backend: routes → controllers → services → repositories, with repositories injected so services are unit-tested with fakes.
- One error-handling middleware maps custom error classes to HTTP status codes; errors come back as `{ "error": "message" }`.
- Purchase is a single conditional `UPDATE`, so two buyers racing for the last unit can never push stock below 0.
- Passwords are hashed with bcrypt and never returned by the API.

## Tech Stack

| Area | Tools |
| --- | --- |
| Backend | Node.js, TypeScript, Express 5, Prisma 6 with SQLite, JSON Web Tokens (`jsonwebtoken`), bcrypt, zod |
| Backend tests | Jest 29, ts-jest, Supertest, against a separate `test.db` SQLite file |
| Frontend | React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS 4 |
| Frontend tests | Vitest 5, React Testing Library, user-event, jsdom |
| CI | GitHub Actions |

## Local Setup

Prerequisites: Node.js 22.12 or newer (Vitest 5 needs it; developed on 22.16, CI uses the current LTS) and npm. No database server is needed: SQLite is a file inside `backend/prisma/`.

Run the backend and the frontend in two terminals.

### Backend

```bash
cd backend
cp .env.example .env      # Windows cmd: copy .env.example .env
npm install
npm run db:push           # prisma db push: creates prisma/dev.db from the schema and generates the client
npm run db:seed           # creates the demo admin; safe to run again ("already exists, nothing to do")
npm run dev               # tsx watch, API on http://localhost:4000
```

Check it is up: `GET http://localhost:4000/health` returns `{"status":"ok","database":"up"}`.

Tests: `npm test` runs the Jest suite (it builds its own `prisma/test.db` and sets its own env, so it never touches `dev.db`), and `npm test -- --coverage` adds the coverage table.

### Frontend

```bash
cd frontend
npm install
npm run dev               # Vite on http://localhost:5173 (or the next free port)
```

Open the URL Vite prints and log in. The Vite dev server proxies every `/api` request to the backend at `http://localhost:4000`, so the browser only talks to one origin and the backend needs no CORS setup. If your backend runs elsewhere, set `VITE_API_PROXY_TARGET` in the shell before `npm run dev` (for example `VITE_API_PROXY_TARGET=http://localhost:4001 npm run dev`); the frontend needs no `.env` file.

Other scripts: `npm test` runs Vitest once, `npm run test:watch` keeps it running, and `npm run build` type-checks and builds to `dist/`.

## Environment Variables

Backend (`backend/.env`, copied from `backend/.env.example`; `.env` is git-ignored):

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file for the running app, relative to `prisma/schema.prisma` (`file:./dev.db`). Tests override it with `file:./test.db`. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. Required: the server refuses to start without it. Use a long random string. |
| `JWT_EXPIRES_IN` | Token lifetime in any format `jsonwebtoken` accepts, e.g. `1h`. Required. |
| `PORT` | Port the API listens on. Optional, defaults to `4000`. |
| `ADMIN_EMAIL` | Email of the demo admin that `npm run db:seed` creates. Needed by the seed script only. |
| `ADMIN_PASSWORD` | Password for that admin. Needed by the seed script only. |

Frontend (dev server only):

| Name | Purpose |
| --- | --- |
| `VITE_API_PROXY_TARGET` | Where the Vite dev server forwards `/api` requests. Optional, defaults to `http://localhost:4000`. Read from the shell environment, not from a `.env` file. |

## Seeded Admin Login

`npm run db:seed` creates one admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. With the values from `backend/.env.example`:

| Email | Password | Role |
| --- | --- | --- |
| `admin@autostock.local` | `Admin@12345` | `admin` |

These are demo credentials for local use; change them for any real deployment. To try the regular-user view, create an account on the Register page: every new account gets the `user` role.

## API Summary

All request and response bodies are JSON. Errors always look like `{ "error": "message" }`. Protected routes need an `Authorization: Bearer <token>` header with the token from login. Any unexpected server error is a 500 with a generic message.

| Method | Path | Auth | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/health` | none | 200 `{ status, database }` | 503 when the database is unreachable |
| POST | `/api/auth/register` | none | 201 `{ id, email, role }` | 400 invalid email or password under 8 characters, 409 email already registered |
| POST | `/api/auth/login` | none | 200 `{ token, user }` | 400 missing email or password, 401 wrong email or password |
| GET | `/api/vehicles` | user | 200 array of vehicles | 401 |
| GET | `/api/vehicles/search` | user | 200 array of vehicles (`[]` when nothing matches) | 400 negative or non-numeric price, or `minPrice` above `maxPrice`; 401 |
| POST | `/api/vehicles` | admin | 201 created vehicle | 400 missing or invalid fields, 401, 403 |
| PUT | `/api/vehicles/:id` | admin | 200 updated vehicle | 400 invalid id or body, 401, 403, 404 |
| DELETE | `/api/vehicles/:id` | admin | 204 no body | 400 invalid id, 401, 403, 404 |
| POST | `/api/vehicles/:id/purchase` | user | 200 vehicle with quantity reduced by 1 | 400 invalid id, 401, 404, 409 out of stock |
| POST | `/api/vehicles/:id/restock` | admin | 200 vehicle with quantity increased | 400 `amount` not a positive whole number or invalid id, 401, 403, 404 |

"user" means any signed-in account; "admin" also requires the `admin` role. 401 is a missing, invalid or expired token; 403 is a valid token without the admin role.

- **Vehicle:** `{ id, make, model, category, price, quantity }`. `make`, `model` and `category` are non-empty strings; `price` is a JSON number `>= 0`; `quantity` is a whole number `>= 0`. Numeric strings such as `"100"` are rejected.
- **Search query:** `make`, `model`, `category` (partial, case-insensitive), `minPrice`, `maxPrice` (inclusive). All optional and combinable, e.g. `/api/vehicles/search?make=toyota&maxPrice=30000`.
- **Restock body:** `{ "amount": 5 }`.
- **Users** are returned as `{ id, email, role }`; the password hash is never part of a response.

## Assumptions

- **The list includes sold-out vehicles.** `GET /api/vehicles` (and search) return vehicles with quantity 0 too, so the dashboard can show them with a disabled Purchase button.
- **Admin for all vehicle writes.** The spec only marks delete and restock as admin-only. Create and update are admin-only as well, to match the admin panel. Purchase is open to any signed-in user.
- **Purchase buys exactly one unit, atomically.** It is one conditional `UPDATE ... WHERE quantity > 0`, so concurrent buyers can never take stock below 0; the loser of a race for the last unit gets 409.
- Search (`GET /api/vehicles/search`): a blank or whitespace-only filter value (for example `?make=` or `?minPrice=%20`) is treated as if it was not sent, so it never filters on an empty string or turns into a price of 0. Text filters match case-insensitively anywhere in the field. On SQLite this case-insensitivity covers ASCII letters only (`koda` finds "Škoda", `škoda` does not).
- Update (`PUT /api/vehicles/:id`): PUT replaces the whole vehicle and sets `quantity` to the exact value sent, not a change relative to the current stock. If a purchase lands just before an admin's update, the update overwrites the decremented quantity. Use restock to add units safely.
- **Delete is a hard delete.** The row is removed from the database; there is no soft delete, archive or purchase history.
- **The role lives in the JWT until it expires.** The token carries the user id and role, and the server trusts it without a database lookup. A user whose role changes (or who is removed) keeps the old access until the token expires (`JWT_EXPIRES_IN`, 1 hour in the example). There are no refresh tokens or server-side logout.
- **No login rate limiting.** Repeated failed logins are not throttled or locked out. Login does give the same 401 message for an unknown email and a wrong password, and takes about the same time for both, so it does not reveal which emails exist.
- **Prices are shown in USD.** The API stores a plain number with no currency; the frontend formats it as US dollars (e.g. `$22,000`).
- **The token is stored in localStorage.** This keeps users signed in across reloads, but any script running on the page could read it (an XSS risk). The app renders no untrusted HTML and the token is short-lived; an httpOnly cookie would be the stronger choice for production.

## Screenshots

| | |
| --- | --- |
| ![Login page](docs/screenshots/login.png) | **Login.** Email and password with inline validation and the server's error message. |
| ![Vehicle dashboard](docs/screenshots/dashboard.png) | **Dashboard.** Vehicle cards with price, stock and a Purchase button that is disabled at quantity 0. |
| ![Search results](docs/screenshots/search.png) | **Search.** Make, model, category and price range filters narrowing the list. |
| ![Admin panel](docs/screenshots/admin.png) | **Admin panel.** Add/edit form beside the vehicle list with restock, edit and delete. |
| ![Mobile view](docs/screenshots/mobile.png) | **Mobile.** The dashboard at phone width, stacked into one column. |

## Test Report

## My AI Usage
