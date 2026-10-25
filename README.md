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
### Backend
### Frontend

## Environment Variables

## Seeded Admin Login

## API Summary

## Assumptions

- Search (`GET /api/vehicles/search`): a blank or whitespace-only filter value (for example `?make=` or `?minPrice=%20`) is treated as if it was not sent, so it never filters on an empty string or turns into a price of 0. Text filters match case-insensitively anywhere in the field. On SQLite this case-insensitivity covers ASCII letters only (`koda` finds "Škoda", `škoda` does not).
- Update (`PUT /api/vehicles/:id`): PUT replaces the whole vehicle and sets `quantity` to the exact value sent, not a change relative to the current stock. If a purchase lands just before an admin's update, the update overwrites the decremented quantity. Use restock to add units safely.

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
