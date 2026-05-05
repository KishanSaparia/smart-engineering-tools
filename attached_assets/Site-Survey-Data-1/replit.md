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

## Artifacts

### ElecSurvey Pro (`artifacts/survey-tool`)
- **Type**: React + Vite web app (fully offline, no backend needed)
- **Preview Path**: `/`
- **Purpose**: Enterprise-grade offline electrical field survey tool for power system studies
- **Equipment Types**: SWGR, SWBD, PNL, DSW, MCC, VFD, XFMR, GEN, ATS, UPS, OTHER (11 types)
- **Storage Architecture**:
  - Equipment metadata: localStorage (via `lib/storage.ts`)
  - Photo binaries: IndexedDB (via `lib/indexeddb.ts`) — handles high-res images without crashes
- **Key Features**:
  - Project info: name, number, client, location, date, surveyor
  - Per-type equipment forms with electrical ratings, protection, cable, and arc flash fields
  - BaseFields component shared across all forms (identification, connectivity)
  - Photo uploader: drag-and-drop, up to 50 photos, sequential auto-naming (EquipName_01.jpg)
  - Upload progress indicator, thumbnail grid, per-photo category labels
  - Excel export: one sheet per equipment type + Summary sheet; column headers match form fields
  - ZIP export: `ProjectName/Photos/TYPE/EquipName/EquipName_01.jpg` folder structure
  - Multiple projects support, filter by equipment type
- **Key libraries**: xlsx, jszip, file-saver
- **Component structure**:
  - `components/EquipmentForm.tsx` — type selector + form router
  - `components/PhotoUploader.tsx` — drag-and-drop with IndexedDB integration
  - `components/FormField.tsx` + `FormSection` — reusable form primitives
  - `components/equipment-forms/` — one file per equipment type
  - `lib/excel-export.ts` — Excel + ZIP export functions
  - `lib/indexeddb.ts` — IndexedDB photo storage wrapper
  - `lib/storage.ts` — localStorage session persistence (no photo binaries)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
