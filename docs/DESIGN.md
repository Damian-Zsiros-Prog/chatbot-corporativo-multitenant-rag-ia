---
name: Enterprise RAG Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001d31'
  on-tertiary-container: '#188ace'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  margin-page: 2rem
  col-width-sidebar: 17.5rem
  col-width-inspector: 26rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system targets enterprise risk, legal, human resources, and compliance officers navigating dense internal documentation through enterprise generative AI. The interface projects supreme governance, auditability, precision, and technical dependability.

The design movement merges **Corporate Precision** with **Engineered Clarity**:
- Ultra-structured density with intentional micro-spacing.
- Zero visual fluff: aesthetic delight stems from crisp typography, authoritative information hierarchy, and instantaneous state communication.
- Visual metaphor: an immutable institutional archive powered by a high-velocity semantic retrieval engine. Interactions feel deliberate, transparent, and provably grounded in verified internal citations.

## Colors

The palette balances institutional gravitas with computational acuity:

- **Primary Canvas & Surfaces**: Base background `slate-50` (`#F8FAFC`), card surfaces pure `#FFFFFF`, sidebars and command bars `slate-900` (`#0F172A`) to `slate-950` (`#020617`).
- **Primary & Secondary Brand**: Deep Navy Slate (`#0F172A`) acts as the anchor for headers, primary buttons, and navigational surfaces. Royal Institutional Blue (`#1E3A8A`) is leveraged for structural selections, active tab fills, and authoritative focus rings.
- **Accents & AI Interactivity**: Tech Cyan/Sky (`#0284C7` and `#38BDF8`) designates generative operations, vector search badges, dynamic citation highlights, streaming tokens, and progressive retrieval state meters.
- **Subtle Borders**: Micro-lines utilize `slate-200` (`#E2E8F0`) in light modes and `slate-800` (`#1E293B`) in dark sub-shells.
- **Vector & Pipeline Semantics**:
  - *Vectorized / Synchronized*: Emerald Green (`#059669` text, `#D1FAE5` surface, `#10B981` border).
  - *Indexing / Queued*: Warm Amber (`#D97706` text, `#FEF3C7` surface, `#F59E0B` border).
  - *Retrieval Failure / Outdated*: Crimson Red (`#DC2626` text, `#FEE2E2` surface, `#EF4444` border).
  - *Semantic Citation Chip*: Slate-Sky hybrid (`#0369A1` text, `#F0F9FF` surface, `#BAE6FD` border).

## Typography

Typography establishes an institutional standard. **Plus Jakarta Sans** provides structural elegance and geometric discipline for headers, workspace names, and metric readouts. **Inter** ensures legibility across dense data tables, legal markdown policies, multi-turn dialogue, and fine-print source metadata.

- Heading elements always utilize a negative tracking value (`-0.015em` to `-0.025em`) to maintain tightness in enterprise cockpits.
- The `mono-code` scale utilizes **JetBrains Mono** for document chunk IDs, vector hashes, embedding dimensions, latency timings, and raw policy clauses.
- RAG conversational outputs default strictly to `body-md` (`14px`/`22px`) to optimize horizontal line scan length when dual-panel inspectors are deployed.

## Layout & Spacing

The architectural layout utilizes an asymmetric three-pane cockpit:
1. **System Navigation Rail / Document Tree** (`col-width-sidebar` / `280px`): Collapsible for deep analysis modes.
2. **Dynamic Work Core** (Fluid Grid): Hosts generative chat canvases, analytics grids, or tabular ingestion pipelines.
3. **Inspector & Source Drawer** (`col-width-inspector` / `416px`): Fixed-to-slide sheet displaying highlighted PDF fragments, vector similarity scores, and metadata attributes.

Grid Rules:
- Multi-column metric displays use an auto-fit 12-column matrix (`minmax(240px, 1fr)`).
- Desktop margins sit at `2rem` (`32px`) with dense `1.5rem` (`24px`) gutters.
- Mobile collapses sidebars into slide-over drawers with touch bounds maintaining a minimum `44px` target area.

## Elevation & Depth

This system avoids expressive blur stacks in favor of high-legibility engineered depth. Spatial hierarchy is communicated via layered surfaces paired with controlled ambient drop shadows:

- **Level 0 (Canvas Base)**: `#F8FAFC` flat canvas.
- **Level 1 (Data Cards, Containers, Tables)**: `#FFFFFF` surface bounded by a crisp 1px `#E2E8F0` hairline border and ambient base shadow (`0 1px 2px 0 rgba(15, 23, 42, 0.04)`).
- **Level 2 (Interactive Floating Bars, Citation Tooltips, Popovers)**: `#FFFFFF` surface with micro-border `#CBD5E1` and medium shadow (`0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`).
- **Level 3 (Source Verification Panes, Modals, Slide-overs)**: `#FFFFFF` bounded by `#0F172A`/`10%` border with deep elevation shadow (`0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`).

## Shapes

The geometric architecture uses `roundedness: 1` (Soft), projecting institutional control, structure, and precision:
- Primary inputs, dense table rows, data cards, and buttons use a baseline `0.375rem` (`6px`) to `0.5rem` (`8px`) border-radius.
- State indicators, citation tags, and metric pills maintain compact `4px` or fully-capsuled `9999px` radii depending on structural hierarchy (e.g., status badges are squared soft-rectangles; numeric citation keys are pills).

## Components

### 1. Interactive RAG Citation Chips & Source Panel
- **Citation In-line Badges**: Rendered within assistant markdown streams as `[1]`, `[Doc: HR-2024 §4.2]`. Default styling: `11px` weight-600 font, `#0284C7` text, `#F0F9FF` fill, and `#BAE6FD` 1px border. Hovering initiates a subtle elevation transform and exposes a preview popover containing the source paragraph, chunk match percentage, and document timestamp.
- **Source Bibliographic Drawer**: Embedded right-aligned slide panel displaying source document name, confidence score (e.g., `Cosine Sim: 0.89`), page number, and original PDF text chunk with extracted keywords highlighted in `#FEF08A` (amber-100).

### 2. Document Vectorization Badges
- Strict high-contrast pill format:
  - **Vectorized**: `#ECFDF5` background, `#047857` label, `#A7F3D0` border, preceded by a solid `6px` emerald pulse dot.
  - **Indexing**: `#FFFBEB` background, `#B45309` label, `#FDE68A` border, paired with an SVG rotary processing spinner.
  - **Error / Unindexed**: `#FEF2F2` background, `#B91C1C` label, `#FECACA` border, accompanied by an alert icon and interactive retry action trigger.

### 3. Analytics KPI Cards
- Base surface `#FFFFFF`, 1px `#E2E8F0` border, `16px` padding.
- Structure: Micro-label upper-case category (`11px` `slate-500`), large tabular metric value (`Plus Jakarta Sans` `24px` bold `slate-900`), and footer micro-trend badge indicating vector token consumption, cache hit ratio, or average query latency (in milliseconds).

### 4. Dense Policy CRUD Tables
- Header: Sticky `#F8FAFC` row with uppercase `11px` `slate-600` labels, `1px` bottom border `#E2E8F0`.
- Cells: `13px` Inter, single-line truncation with tooltip triggers, strict vertical padding of `10px` to maintain dense scannability.
- Row Action Suite: Hover-revealed action group (Re-index, Inspect Chunks, Export Meta, Delete) styled with ghost icon buttons (`hover:bg-slate-100`).

### 5. Input Fields & Query Prompt Engine
- Prompt container: Floating command box (`#FFFFFF`) with subtle outer focus ring (`0 0 0 2px #0284C7` offset `2px`). Includes policy scope dropdown selector, token counter indicator, and authoritative submission button (`#0F172A` background, `#FFFFFF` text, `hover:bg-slate-800`).