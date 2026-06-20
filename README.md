# Sandbox.ai

A real two-tier application: **Next.js frontend** + **FastAPI backend** + **Postgres**.

## Why this replaces the old single `index.html` file

The previous version of this app was one ~8,300-line HTML file with all the
JavaScript inline. It worked as a demo, but it had three real problems this
rewrite fixes:

| Old problem | Fixed by |
|---|---|
| Anthropic API key would have to live in browser JS, exposed to anyone who opens dev tools | `backend/app/services/ai_generation.py` — the key lives only in the backend's environment variables, the frontend never sees it |
| "Save project" created a **new** localStorage entry with a fresh `Date.now()` id every time `renderGenerateResults` re-ran (e.g. after a Git push triggered a re-analysis) | `backend/app/routers/projects.py` — `POST /projects` creates a row exactly once; every subsequent save uses `PUT /projects/{id}`, which can only ever update that same row. There is no code path that can create a duplicate. |
| `TENANT_NAME = "demo-tenant"` and `genName` input both had hardcoded default values | `frontend/app/page.tsx` requires creating a real workspace before any project work; `frontend/app/generate/page.tsx` requires an explicit project name and blocks generation (with a visible shake + focus) if it's empty |
| No real routing — `showView()` hid/showed `<div>`s and faked the URL bar | Real Next.js App Router — every page is a real route, browser back/forward works natively |
| 179 global functions, no type safety, frequent naming collisions (e.g. the `projectName` vs `name` bug we hit) | TypeScript throughout the frontend; Pydantic schemas validate every request/response on the backend |

## Project structure

```
sandbox-ai/
├── backend/                  FastAPI + SQLAlchemy + Postgres
│   ├── app/
│   │   ├── models.py          Tenant, User, Project, DeployEvent, AuditLog
│   │   ├── schemas.py          Pydantic request/response validation
│   │   ├── routers/             /tenants /projects /generate /push /deployments
│   │   └── services/             ai_generation, fallback_generator, github_push
│   └── main.py
├── frontend/                 Next.js 14 (App Router) + TypeScript + Tailwind
│   ├── app/
│   │   ├── page.tsx             Home — tenant onboarding + project list
│   │   ├── generate/page.tsx     Generate — required name, blocks on empty
│   │   └── projects/[id]/page.tsx Project detail — save = update, never duplicate
│   ├── components/Sidebar.tsx    Real React component, grouped nav
│   └── lib/
│       ├── api.ts                  Single typed API client
│       └── tenant.ts                No hardcoded default tenant
└── docker-compose.yml          Runs db + backend + frontend together
```

## Running locally

```bash
cp backend/.env.example backend/.env
# edit backend/.env and add your real ANTHROPIC_API_KEY

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

## What's intentionally NOT carried over from the old file

- No hardcoded `demo-tenant` or `orders-service` default values anywhere
- No client-side Anthropic API calls
- No `localStorage`-based "saved projects" — everything is a real Postgres row

## What still needs to be built before this is launch-ready

This scaffold covers the core flow (generate → save → push → track
deployments) end-to-end and is fully tested. Still outstanding for a real
launch:

- Real authentication (JWT login flow — the `User` model and password
  hashing utilities exist in `backend/app/models.py` but there's no
  login UI yet)
- The remaining pages from the old prototype (Templates, Analytics, Policies,
  Deployments dashboard, etc.) — the backend has the deployment-events API
  ready; the frontend pages need to be built the same way `generate` and
  `projects/[id]` were
- Production Terraform/deployment config (the `infra/` folder is a stub)
- Rate limiting and request validation hardening on the AI generation endpoint
