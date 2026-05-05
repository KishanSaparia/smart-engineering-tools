# Site Survey Website Overview

This website is an **offline-first site survey tool** for collecting electrical equipment data in the field.

Its main goal is to help survey teams:
- create projects for each site/job,
- record equipment details using structured forms,
- attach photos to each equipment entry,
- and export everything into deliverables (Excel, ZIP, and one-line PDF).

## What We Are Doing With This Website

We are building a workflow where survey data is captured in a consistent format and can be handed off quickly for engineering, reporting, and documentation.

In simple terms:
1. Create a project (site name, surveyor, location, client, date).
2. Add equipment entries (switchgear, panel, transformer, MCC, UPS, etc.).
3. Fill required/optional fields and attach photos.
4. Review and edit entries.
5. Export project outputs for sharing and records.

## Main Screens and Flow

### 1) Home (`/`)
- Shows all projects.
- Lets users create new projects.
- Supports project search and delete.
- If a project has entries, delete action exports data first.

### 2) Project Detail (`/project/:id`)
- Two main tabs:
  - **Add Equipment**: choose equipment type and start a form.
  - **Entries**: view, search, filter, and manage saved entries.
- Shows project-level counts (entries, photos, types, arc-flash labels).
- Links to Import/Export tools.

### 3) New Equipment Form (`/project/:id/new/:type`)
- Dynamic field sections based on equipment type.
- Required fields are validated.
- Photos can be captured/uploaded before save.
- Prevents duplicate equipment names inside the same project.

### 4) Entry Detail (`/project/:id/entry/:entryId`)
- Edit any saved entry.
- Add/remove photos.
- Tracks completion progress for required fields.
- Keeps duplicate-name protection during updates.

### 5) Export & Manage (`/project/:id/export`)
- Export full project as ZIP:
  - Excel workbook with sheets by equipment type,
  - summary sheet,
  - photos organized by equipment type/name.
- Generate one-line diagram PDF from `fedFrom` relationships.
- Import Excel workbook to create entries in bulk.
- Download sample Excel template and import error reports.
- Export-then-delete project flow for safe cleanup.

## Data and Storage Model

- Data is stored locally in the browser using `idb-keyval` (IndexedDB).
- Core entities:
  - `Project`
  - `EquipmentEntry`
  - `Photo` blobs
- This design supports field/offline use and keeps data on-device until explicitly exported.

## Quality and Safety Rules Built In

- **Unique equipment names per project** to reduce ambiguity.
- **Required field checks** before save/import.
- **Import skip reporting** for bad rows (CSV + TXT report).
- **One-line diagram issue reporting** for missing sources, cycles, self-links, and duplicate names.
- **Export before destructive actions** (project deletion with data).

## Deliverables Produced by the Website

- **Project ZIP**: Excel + organized photos.
- **One-line PDF**: visual electrical connection diagram.
- **Import template**: ready-to-fill sample Excel.
- **Error reports**: import/diagram issues as CSV/TXT.

## Who This Helps

- Field survey technicians collecting equipment data.
- Engineers reviewing distribution paths and equipment details.
- Project teams needing clean handoff artifacts (spreadsheets, photos, one-line diagrams).

## Current Product Direction (Short Version)

The website is focused on making site survey data:
- **consistent** (structured forms),
- **fast to capture** (type-based forms + photo support),
- **easy to audit** (search/filter/edit + validation),
- and **easy to deliver** (export/import + diagram generation).

