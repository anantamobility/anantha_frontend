# Anantha Frontend — Ops Desk

Greenfield React Ops Desk for `anantha_backend`. Separate from EVZIP `Frontend/`.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · React Router · axios · RHF/Zod-ready

## Setup

```bash
cd anantha_frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3030
npm install
npm run dev            # http://localhost:5173
```

Backend (separate terminal):

```bash
cd anantha_backend
npm run seed && npm run seed:demo
npm run dev            # port 3030
```

Demo login: `9000000000` / `DemoPassword123`

## Live surface (aligned with backend)

Only APIs that are currently live on `anantha_backend` are wired:

- **Database:** Hubs, Vehicles, Riders (incl. status + documents), Rate cards
- **Admin:** Users (incl. admin password reset), Staff, Roles/PBAC, Audit logs
- **Auth:** Login, logout, refresh, change-password, admin reset-password

Home redirects to `/hubs`. Dead modules (dashboard/clients/rentals/collections) are removed until backend re-enables them.

## Demo script

1. Sign in as admin → lands on **Hubs**.
2. Create a hub (`city` + `state`; `hubCode` is generated).
3. Create vehicles / riders (rider create requires a strong password).
4. Use rider **Status** / **Docs** actions; PVC/BGV are date fields + document types, not a verification workflow.
5. Manage **Users** (reset password, role, status) and **Staff** (how operator accounts are created).
6. Soft RBAC hides nav items; API 403 remains authoritative.

## Architecture

Feature slices under `src/features/*`. Shared infrastructure only in `features/shared` (apiClient, Auth, layouts, common UI, entities). Pages never import `apiClient` directly.
