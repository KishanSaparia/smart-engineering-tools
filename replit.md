# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Site Survey App

An offline site survey data collection web app for electrical equipment inspections.

### Features
- **13 Equipment Types**: Switchgear, Switchboard, Panel, Transformer, Disconnect Switch, Enclosed Circuit Breaker, Motor Control Center, VFD, Motor, Generator, ATS, UPS, Unknown Equipment
- **Offline Storage**: All data stored in browser IndexedDB via `idb-keyval`
- **Conditional Fields**: MLO/MAIN toggles breaker data, Arc Flash Yes shows label field, Fused DSW shows fuse fields
- **Photo Capture**: Camera support for each equipment entry
- **Export**: Downloads ZIP with Excel file (per-type sheets + summary) and organized photos
- **Delete Project**: Auto-exports data before permanent deletion

### Key Files
- `artifacts/site-survey/src/lib/db.ts` — IndexedDB data layer (projects, entries, photos)
- `artifacts/site-survey/src/lib/equipment-fields.ts` — Field definitions with conditions/dropdowns per equipment type
- `artifacts/site-survey/src/lib/export.ts` — Excel + ZIP export logic
- `artifacts/site-survey/src/pages/` — All page components (home, project-detail, equipment-form, entry-detail, export-page)

### Dependencies
- `xlsx` — Excel file generation
- `jszip` — ZIP archive creation
- `file-saver` — Browser file download
- `idb-keyval` — IndexedDB wrapper for offline storage

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
