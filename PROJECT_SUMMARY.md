# Electrical Tools — Project Summary

> **Offline-first web application** for electrical engineers combining a **Site Survey Tool** and a **9-module NEC-compliant Engineering Calculator Suite**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 7 |
| **Styling** | TailwindCSS 4 + Radix UI primitives |
| **Routing** | Wouter (lightweight client-side router) |
| **State** | React hooks + TanStack React Query |
| **Storage** | IndexedDB via `idb-keyval` (fully offline) |
| **Export** | jsPDF, JSZip, xlsx (PDF/ZIP/Excel exports) |
| **Icons** | Lucide React |
| **Animations** | Framer Motion + CSS `animate-in` utilities |
| **Dark Mode** | `next-themes` toggle |

---

## Application Architecture

```
Landing Page (/)
├── Site Survey Tool (/survey)
│   ├── Project List (/survey)
│   ├── Project Detail (/project/:id)
│   ├── Equipment Form (/project/:id/new/:type)
│   ├── Entry Detail (/project/:id/entry/:entryId)
│   └── Export Page (/project/:id/export)
│
└── Electrical Calculator (/calculator)
    ├── Calculator Home (/calculator)
    │
    │── Basic Tools
    │   ├── Transformer Short Circuit (/calculator/transformer-sc)
    │   ├── Voltage Drop Calculator (/calculator/voltage-drop)
    │   ├── Cable Size Calculator (/calculator/cable-size)
    │   └── Full Load Current (/calculator/full-load-current)
    │
    │── Design & Optimization
    │   ├── Smart Design Engine (/calculator/smart-design)
    │   ├── Motor Design & Starting (/calculator/motor-design)
    │   └── Transformer & Equipment Design (/calculator/transformer-design)
    │
    └── Advanced Analysis
        ├── Full System Validation Engine (/calculator/system-validation)
        └── Arc Flash Analysis (/calculator/arc-flash)
```

---

## Module 1: Site Survey Tool

**Route:** `/survey`

A complete offline-capable field data collection tool for electrical site surveys.

### Features
- **Project Management** — Create, edit, delete survey projects with metadata
- **Equipment Forms** — Structured forms for recording electrical equipment data (panels, transformers, switchgear, etc.)
- **Entry Detail** — View and manage individual equipment entries with photo attachments
- **Export** — Generate PDF reports, Excel spreadsheets, and ZIP bundles of survey data
- **Offline Storage** — All data stored in IndexedDB, works without internet

### Key Files
| File | Purpose |
|------|---------|
| `pages/home.tsx` | Project list dashboard |
| `pages/project-detail.tsx` | Single project view with entries |
| `pages/equipment-form.tsx` | Equipment data entry form |
| `pages/entry-detail.tsx` | Individual entry viewer |
| `pages/export-page.tsx` | Export options (PDF/Excel/ZIP) |

---

## Module 2: Engineering Calculator Suite

**Route:** `/calculator`

Nine NEC-compliant electrical engineering calculators, all running 100% offline with real-time reactive computation.

### Shared UI Architecture

All calculators use a standardized component system:

| Component | Purpose |
|-----------|---------|
| `CalcShell` | Layout wrapper with header, breadcrumbs, accent theming |
| `CalcSection` | Bordered card container for input groups |
| `CalcInput` | Styled input with `FieldLabel` (label + unit + hint) |
| `CalcSelect` | Styled select dropdown with `FieldLabel` |
| `CalcSegment` | Toggle-button group (e.g. Copper/Aluminum, 3%/5%) |
| `CalcToggle` | Switch with label and description |
| `CalcActions` | Full-width Calculate + Reset button bar |
| `CalcError` | Validation error banner |
| `ResultCard` | Metric display card |
| `ResultGrid` | Grid wrapper for result cards |
| `StatusBanner` | SAFE/FAIL status bar |
| `HeroMetric` | Large highlighted result value |
| `InfoBox` | Engineering notes container |

---

### Calculator 1: Transformer Short Circuit Current

**Route:** `/calculator/transformer-sc`  
**Engine:** `formulas.ts`

Calculates primary and secondary bolted fault current for three-phase transformers assuming an infinite bus.

| Input | Output |
|-------|--------|
| kVA Rating | Secondary Fault Current (kA) |
| Primary Voltage (V) | Primary Fault Current (kA) |
| Secondary Voltage (V) | Full Load Current (A) |
| Impedance (%Z) | One-Line Diagram |

**Standard:** IEEE C57 / NEC Article 240

---

### Calculator 2: Voltage Drop Calculator

**Route:** `/calculator/voltage-drop`  
**Engine:** `vdropFormulas.ts`

Calculates cable voltage drop for single-phase and three-phase systems with NEC-based conductor resistance data.

| Input | Output |
|-------|--------|
| System Voltage (V) | Voltage Drop (V) |
| Load Current (A) | Voltage Drop (%) |
| Cable Length (ft/m) | Receiving End Voltage |
| Cable Size | Pass/Fail status (3%/5%) |
| Conductor Material | Cable size recommendations |
| Phase (1φ/3φ) | |

**Standard:** NEC 210.19(A) / NEC 215.2(A)

---

### Calculator 3: Cable Size Calculator

**Route:** `/calculator/cable-size`  
**Engine:** `cableFormulas.ts` + `necTable.ts`

Finds the appropriate cable size based on ampacity from NEC Table 310.15(B)(16). Supports parallel conductors for large loads.

| Input | Output |
|-------|--------|
| Load Current (A) | Recommended Cable Size |
| Temperature Rating | Ampacity (A) |
| Conductor Material | Parallel Runs Needed |
| Derating Factor | Derating Applied |

**Standard:** NEC 310.15(B)(16), NEC 310.10(H)

---

### Calculator 4: Full Load Current

**Route:** `/calculator/full-load-current`  
**Engine:** `flcFormulas.ts`

Calculates three-phase full load current from kW, kVA, or HP input with power factor support.

| Input | Output |
|-------|--------|
| Power (kW / kVA / HP) | Full Load Current (A) |
| Voltage (V) | Power conversion |
| Power Factor | |
| Efficiency (for HP) | |

**Standard:** Basic electrical formulas (P = √3 × V × I × PF)

---

### Calculator 5: Smart Design Engine

**Route:** `/calculator/smart-design`  
**Engine:** `smartEngine.ts`

One-click automated cable sizing and optimization engine. Evaluates all possible cable configurations and ranks them by NEC compliance, voltage drop, and cost efficiency.

| Input | Output |
|-------|--------|
| System Voltage (V) | Top 3 Ranked Solutions |
| Load Current (A) | Cable Size + Parallel Runs |
| Cable Length (ft/m) | Voltage Drop (V, %) |
| Conductor Material | Total Ampacity |
| VD Limit (3%/5%) | Headroom (%) |

**Standard:** NEC 310.15(B)(16), NEC 310.10(H)

---

### Calculator 6: Motor Design & Starting

**Route:** `/calculator/motor-design`  
**Engine:** `motorFormulas.ts` + `motorEngine.ts` + `motorTables.ts`

Complete NEC Article 430 motor branch circuit designer. Covers FLC lookup, overload sizing, breaker selection, starter type impact, and cable optimization.

| Input | Output |
|-------|--------|
| Motor HP | Full Load Current (NEC 430.250) |
| Voltage (V) | Overload Protection Size |
| Motor Type | Branch Circuit Breaker Size |
| Starter Type | Cable Solutions (ranked) |
| Protection Device | Starting Current |
| Cable Length | Voltage Drop per solution |

**Standard:** NEC Article 430 (430.6, 430.32, 430.52, 430.250)

---

### Calculator 7: Transformer Fault, Cable & Equipment Engine

**Route:** `/calculator/transformer-design`  
**Engine:** `transformerDesignEngine.ts` + `transformerDesignData.ts`

End-to-end system optimizer with two modes:

**Design Mode:** Auto-generates optimal cable configurations given transformer and equipment parameters.

**Verify Mode:** Validates a user-selected cable against ampacity, voltage drop, fault current, and equipment ratings.

| Input | Output |
|-------|--------|
| Transformer (kVA, V, %Z) | Transformer FLC & Fault Current |
| Cable Length (ft/m) | Cable Solutions (ranked) |
| Conductor Material | Voltage Drop per solution |
| Equipment Ratings | Equipment Rating Verification |
| VD Limit (3%/5%) | Smart Recommendations |

**Standard:** NEC 310.15(B)(16), NEC 310.10(H), NEC 240

---

### Calculator 8: Full System Validation Engine

**Route:** `/calculator/system-validation`  
**Engine:** `validationEngine.ts`

Unified validation engine that checks the entire electrical path: transformer → cable → breaker → downstream equipment. Provides overall SAFE/WARNING/FAIL status with auto-design alternatives.

| Input | Output |
|-------|--------|
| Transformer Parameters | Overall System Status |
| Load Current | Cable Ampacity & VD Check |
| Cable Size & Length | Fault Current (Transformer + End) |
| Breaker Rating (Optional) | Breaker Verification |
| Equipment Ratings | Equipment Verification |
| | Auto Design Alternatives |
| | Smart Recommendations |

**Standard:** NEC 310, NEC 240, NEC 110.9

---

### Calculator 9: Arc Flash Analysis

**Route:** `/calculator/arc-flash`  
**Engine:** `arcFlashEngine.ts`

IEEE 1584 simplified arc flash incident energy calculator with PPE category determination, hazard boundary visualization, and safety recommendations.

| Input | Output |
|-------|--------|
| System Voltage (V) | Incident Energy (cal/cm²) |
| Bolted Fault Current (kA) | PPE Category (0–4) |
| Equipment Type | Arc Flash Boundary (m) |
| Grounding | Risk Level |
| Gap (mm) — optional | Working Distance |
| Clearing Time (s) — optional | Hazard Boundary Diagram |
| Working Distance — optional | PPE Requirements List |
| Arc Current (kA) — optional | Safety Recommendations |
| Electrode Config — optional | Input Audit Trail |

**Standard:** IEEE 1584-2018 (Simplified), NFPA 70E

---

## File Structure

```
artifacts/site-survey/src/
├── App.tsx                          # Router + providers
├── main.tsx                         # Entry point
├── index.css                        # Global styles + Tailwind
│
├── pages/                           # Survey module pages
│   ├── landing.tsx                   # Module selector (Survey vs Calculator)
│   ├── home.tsx                      # Project dashboard
│   ├── project-detail.tsx            # Project view
│   ├── equipment-form.tsx            # Equipment data entry
│   ├── entry-detail.tsx              # Entry viewer
│   ├── export-page.tsx               # Export (PDF/Excel/ZIP)
│   └── not-found.tsx                 # 404 page
│
├── components/                       # Shared components
│   ├── theme-toggle.tsx              # Dark/light mode switch
│   ├── page-footer.tsx               # Footer
│   ├── equipment-icon.tsx            # Equipment type icons
│   └── ui/                           # Radix-based primitives
│
├── hooks/                            # Custom React hooks
├── lib/                              # Utilities
│
└── calculator/                       # Calculator module
    ├── CalculatorHome.tsx             # Calculator landing page
    ├── CalcShell.tsx                  # Shared layout shell
    ├── CalcUI.tsx                     # Shared UI component library
    │
    ├── TransformerSC.tsx              # Transformer Short Circuit
    ├── formulas.ts                    #   └─ Engine
    │
    ├── VoltageDrop.tsx                # Voltage Drop Calculator
    ├── vdropFormulas.ts               #   └─ Engine
    │
    ├── CableSize.tsx                  # Cable Size Calculator
    ├── cableFormulas.ts               #   └─ Engine
    ├── necTable.ts                    #   └─ NEC ampacity tables
    │
    ├── FullLoadCurrent.tsx            # Full Load Current
    ├── flcFormulas.ts                 #   └─ Engine
    │
    ├── SmartDesign.tsx                # Smart Design Engine
    ├── smartEngine.ts                 #   └─ Engine
    │
    ├── MotorDesign.tsx                # Motor Design & Starting
    ├── motorFormulas.ts               #   └─ Engine (FLC/breaker)
    ├── motorEngine.ts                 #   └─ Engine (cable optimization)
    ├── motorTables.ts                 #   └─ NEC 430.250 data
    │
    ├── TransformerDesign.tsx           # Transformer & Equipment Engine
    ├── transformerDesignEngine.ts      #   └─ Engine
    ├── transformerDesignData.ts        #   └─ Ampacity/rating data
    │
    ├── FullSystemValidation.tsx        # Full System Validation
    ├── validationEngine.ts             #   └─ Engine
    │
    └── ArcFlashAnalysis.tsx            # Arc Flash Analysis
        arcFlashEngine.ts               #   └─ Engine
```

---

## Design System

### Theming
- **Dark/Light mode** via CSS variables and `next-themes`
- **Accent colors** per calculator (blue, cyan, violet, amber, indigo, emerald, sky, teal, orange)
- **Glassmorphism** effects with `backdrop-blur` and translucent backgrounds

### Layout Pattern
All calculators follow a **full-width stacked layout**:
1. `CalcShell` — Header with icon, title, subtitle, breadcrumbs
2. Info badge — Colored context banner
3. `CalcSection` cards — Grouped inputs with `CalcInput`/`CalcSelect`
4. `CalcActions` — Full-width calculate + reset buttons
5. Results — Flow below inputs with animations

### Key Design Tokens
- Border radius: `rounded-xl` (inputs), `rounded-2xl` (cards)
- Shadows: `shadow-sm` (cards), `shadow-md` (hover)
- Focus: `ring-2 ring-primary/30`
- Status colors: emerald (safe), amber (warning), red (fail)

---

## Running Locally

```bash
# Navigate to project
cd artifacts/site-survey

# Install dependencies
pnpm install

# Start dev server
set PORT=5173
set BASE_PATH=/
pnpm dev

# Build for production
pnpm build
```

**URL:** `http://localhost:5173`

---

## NEC Standards Referenced

| Standard | Used In |
|----------|---------|
| NEC 210.19(A) | Voltage Drop |
| NEC 215.2(A) | Voltage Drop |
| NEC 240 | Breaker sizing |
| NEC 310.10(H) | Parallel conductors |
| NEC 310.15(B)(16) | Ampacity tables |
| NEC Article 430 | Motor circuits |
| NEC 110.9 | Equipment SC rating |
| IEEE 1584-2018 | Arc Flash |
| IEEE C57 | Transformer fault |
| NFPA 70E | PPE categories |
