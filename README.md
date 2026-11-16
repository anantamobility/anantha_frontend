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
npm run seed
npm run dev            # port 3030
```

Seeded admin login: `1234567890` / `supersecret123`

## Live surface (aligned with backend)

- **Database:** Hubs, Vehicles, Riders, Rate cards, Staff
- **Roles and permissions** (top-level)
- **Audit logs** (top-level)
- **Auth:** Login, logout, refresh, change-password

Home redirects to `/hubs`. Soft RBAC hides nav items; API 403 remains authoritative.

## Architecture

Feature slices under `src/features/*`. Shared infrastructure only in `features/shared` (apiClient, Auth, layouts, common UI, entities).
