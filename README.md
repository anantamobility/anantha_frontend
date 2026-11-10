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

## Demo script

1. Sign in as admin.
2. Open **Dashboard** — KPIs load for the selected date range.
3. Browse **Hubs / Vehicles / Riders / Clients**.
4. On **Rate cards**, use **Assign** to link a rate card to a client (required before rental create).
5. **Rentals** → Create (client + rider + rate card + optional vehicle) → Assign vehicle if needed → **Activate** → **Generate dues**.
6. **Collections** → Record collection against an active rental (cleared payments allocate to dues).
7. Sidebar hides modules the soft role map cannot access; API 403 remains authoritative.

## Architecture

Feature slices under `src/features/*`. Shared infrastructure only in `features/shared` (apiClient, Auth, layouts, common UI, entities). Pages never import `apiClient` directly.
