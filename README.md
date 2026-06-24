# Agentic Coding Advanced Exercises

This repository contains a set of advanced agentic coding exercises plus a synthetic marketplace fixture used by those exercises.

There are two main parts:

- `agent/`: the TypeScript exercise code and smoke test harness
- `marketplace/src/`: a small synthetic monorepo with a storefront API/UI, an admin review inbox, shared packages, and placeholder app workspaces

## Repository Structure

```text
.
├── agent/
│   └── src/
├── instructions/
│   ├── 010/
│   ├── 020/
│   ├── 030/
│   └── 040/
├── knowledge-base/
│   └── issue-resolutions/
├── marketplace/
│   └── src/
│       ├── apps/
│       │   ├── admin/
│       │   ├── seller-portal/
│       │   └── storefront/
│       ├── packages/
│       │   ├── auth/
│       │   ├── catalog/
│       │   ├── checkout/
│       │   ├── search/
│       │   ├── ui/
│       │   └── web/
│       ├── public/
│       ├── package.json
│       └── server.js
├── package.json
└── tsconfig.json
```

## Key Directories

- `agent/src/`: starter implementation, MCP tool wiring, impact analysis logic, and smoke tests.
- `instructions/`: exercise briefs. `020` and `040` focus on the consensus review workflow and QMD-backed reply memory.
- `knowledge-base/issue-resolutions/`: Markdown files written by the admin reply API when an author responds to a review thread.
- `marketplace/src/server.js`: the main marketplace demo server.
- `marketplace/src/apps/admin/server.js`: the admin review inbox server and local chat API used by the review workflow exercises.
- `marketplace/src/apps/storefront/src/` and `marketplace/src/apps/seller-portal/src/`: placeholder app source trees included as monorepo fixtures. They are not launched by standalone dev servers in this repository.
- `marketplace/src/packages/`: shared package fixtures used by the impact-analysis and review exercises.

## Available Apps

### 1. Marketplace App

This is the main synthetic marketplace app served from `marketplace/src/server.js`.

What it provides:

- static UI from `marketplace/src/public/`
- JSON endpoints for products, collections, and cart summary
- default port `3000`

Launch it:

```bash
cd marketplace/src
npm install
npm run start
```

Development mode:

```bash
cd marketplace/src
npm run dev
```

Useful endpoints:

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/collections`
- `GET /api/cart/summary`

Open:

```text
http://localhost:3000
```

### 2. Admin Review Inbox

This is the local review-thread app used by the later workflow exercises. It is served from `marketplace/src/apps/admin/server.js`.

What it provides:

- static admin UI from `marketplace/src/apps/admin/public/`
- local chat thread API for accepted review findings
- reply capture that persists author replies as Markdown in `knowledge-base/issue-resolutions/`
- default port `3001`

Launch it:

```bash
cd marketplace/src
npm install
npm run admin
```

Development mode:

```bash
cd marketplace/src
npm run admin:dev
```

Useful endpoints:

- `GET /api/health`
- `GET /api/chat/threads`
- `GET /api/chat/threads/:id`
- `POST /api/chat/threads`
- `POST /api/chat/threads/:id/reply`

Open:

```text
http://localhost:3001
```

## Non-runnable Fixture Workspaces

These workspaces exist so the exercises have a realistic monorepo shape, but they do not currently have standalone launch commands in this repository:

- `marketplace/src/apps/storefront`
- `marketplace/src/apps/seller-portal`
- `marketplace/src/packages/auth`
- `marketplace/src/packages/catalog`
- `marketplace/src/packages/checkout`
- `marketplace/src/packages/search`
- `marketplace/src/packages/ui`
- `marketplace/src/packages/web`

They should be treated as fixture code for agent analysis, review, and impact computation.

## Exercise Commands

The root package contains the agent exercise commands:

```bash
npm install
npm run check
npm run build
npm run smoke
```

What they do:

- `npm run check`: type-checks the root TypeScript exercise code
- `npm run build`: compiles the root exercise code into `dist/`
- `npm run smoke`: builds and runs the smoke test for the agent exercise

## Notes

- Root dependencies and marketplace dependencies are managed separately. Use `npm install` in the repository root for the agent exercise, and in `marketplace/src` for the marketplace apps.
- The admin reply API stores one Markdown file per replied thread in `knowledge-base/issue-resolutions/`.
- The exercise instructions are the source of truth for the expected workflow behavior in each exercise.
