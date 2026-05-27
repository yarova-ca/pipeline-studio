# DevSecOps Pipeline Studio — UX, Structural & Maintainability Audit

**Target:** `index.html` (12,983 lines, ~800 KB single-file app)
**Method:** Four parallel audits — HTML/a11y structure, CSS/visual consistency, JS functional bugs, information architecture.
**Companion doc:** `REFACTOR_PLAN.md` — actionable, phased ticket list with acceptance criteria.

---

## TL;DR — Why it feels "yuck"

The app is **two systems fighting each other**:

1. A clean design system (`:root` tokens, semantic classes) lives in `<style>`.
2. A copy-paste-driven inline-style explosion lives in the body — **513 `style="..."` attributes**, **41 distinct background colors**, **21 font sizes**, **13 border radii**, **23 ad-hoc box-shadows**, **11 z-index layers with no hierarchy**.

On top of that, the **critical path is buried**: a first-time user sees ~1,200–1,500 px of conceptual scaffolding, three competing navigation systems (sidebar + sticky tab/config bars + right TOC), **9 dropdowns**, **9 stacked banners**, and **5 different ways to "pick decisions"** (setup wizard, decision map, decision-picker modal, phase-context bar, phase 0) — *before* they ever reach the pipeline YAML they came for.

The functional layer is also unstable: **59 inline `onclick=` handlers** mixed with `addEventListener`, ~20 unguarded `getElementById` calls, no URL/history sync for tabs, no modal focus-trap, and an industry→compliance auto-link that silently overwrites the user's manual choice.

---

## 1. Information Architecture — the "wall of stuff" problem

| # | Finding | Severity |
|---|---------|----------|
| IA-1 | **1200–1500 px stacks above the first tab content.** Config bar → why-panel → 4 warning banners → compliance banner → industry context → phase-context bar → hero → concept (5-stat grid + 3 cards + 2 tables) → decision map → phase 0 → tab bar. On a 1080p screen the user must scroll twice before reaching any pipeline. | CRITICAL |
| IA-2 | **5 ways to "pick decisions"** — wizard modal, on-page decision map, decision-picker modal, phase-context bar, phase-0 steps. The wizard and decision map do the same job through different UX. | HIGH |
| IA-3 | **Triple navigation at equal visual weight** — left sidebar (252 px, scope+invariants+mini-nav), sticky top config-bar+tab-bar, right TOC (200 px). New users have three competing mental models. | HIGH |
| IA-4 | **9 config selects with no grouping.** Mode (reading preference) sits next to Frontend (critical). Industry, Compliance, Package Manager, Mode are power-user toggles displayed at the same weight as the must-haves. | HIGH |
| IA-5 | **14 tabs, several overlap:** `glossary`+`catalog` are both reference; `local`+`setup` are both onboarding; `tradeoffs`+`mistakes` are both decision-help. | MED |
| IA-6 | **Role modes (Default/Learn/Ship/Audit) don't reduce complexity** — they hide 1–2 tabs and tweak widths, but leave all 9 selects, all banners, and all conceptual scaffolding intact. | MED |
| IA-7 | **Terminology drift:** "phase" vs "stage" vs "step" used inconsistently (468 / 378 / 166 hits). "Decision" vs "tile" vs "choice" overlap. "Stack" vs "framework" vs "language" conflated. | MED |
| IA-8 | **Sidebar "Start here" links** (Concept, Phase 0, Search) duplicate content already prominent at the top. | LOW |

---

## 2. Visual Consistency — why nothing is in harmony

Design tokens are defined but ignored. The numbers:

| Category | Tokens defined | Variants actually used |
|---|---|---|
| Background colors | 2 (`--bg`, `--surface`) | **41** distinct hex/rgb |
| Font sizes | 0 | **21** (8 / 8.5 / 9 / 9.5 / 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 15 / 16 / 18 / 19 / 20 / 22 / 24 / 26 px) |
| Border radii | 3 (`--r`, `--r-sm`, `--r-lg`) | **13** (2 / 3 / 4 / 5 / 6 / 7 / 8 / 10 / 12 / 14 / 20 / 50 px) |
| Box shadows | 2 (`--sh1`, `--sh2`) | **23** ad-hoc inline shadows |
| Border colors | 2 (`--border`, `--border-subtle`) | **7+** hardcoded |
| Z-index | 0 (ad-hoc) | **11** values; two modals tied at 200 |
| Padding | 0 | **20** distinct px values |
| Inline `style=` attrs | — | **513** in `<body>` |
| `!important` declarations | — | **15** |

### High-severity examples

| # | Finding | Lines |
|---|---------|-------|
| V-1 | **3 different pale blues for 3 different "info" banners** with no semantic difference: `#f5f9ff` (why-panel), `#f0f9ff` (phase-context), `#e8f4fd` (nextjs-warning). Plus 2 yellow-oranges (`#fff8dc`, `#fff7ed`) and 2 greens. | 854, 858, 869, 879, 889, 919 |
| V-2 | **12+ ad-hoc button styles** — primary/secondary/ghost have no contract. Some use `var(--accent)`, others hardcode. Padding varies 3 / 7 / 12 / 16 px across buttons that look like peers. | 509, 540, 542, 825, 827, 829, 831, 855, 880, 934 |
| V-3 | **Border-left accent widths inconsistent on warnings:** 4 px on coming-soon, 3 px elsewhere, none on industry-context. | 851, 854, 869, 879, 889, 895 |
| V-4 | **12+ distinct grays** for text (`#8b949e` ×9, `#6e7681` ×7, `#57606a`, `#666`, `#333`, `#6b7280`…) despite `--text-sec` and `--muted` tokens existing. | many |
| V-5 | **Pill component reinvented 5+ times** — `.ds-pill`, `.swim-pill`, `.ds-nav-chip`, `.pb-ph-*`, plus inline pills. | 124, 256–261, 419, 486 |
| V-6 | **Z-index gaps and ties** — qf-overlay and threat-tour-modal both at 200; opening both produces undefined stacking. | 503, 516, 528, 548, 922 |

**Root cause:** CSS uses tokens; inline styles in the body almost never do.

---

## 3. Structural & Accessibility Issues

| # | Finding | Lines | Severity |
|---|---------|-------|----------|
| S-1 | **All 14 tab panels render simultaneously.** `.tab-content { display:block }` and `.tab-content.active { display:block }` are identical — no `display:none` on inactive tabs. | 156–157 | HIGH |
| S-2 | **5 modals have no modal semantics** — no `role="dialog"`, `aria-modal="true"`, focus trap, or `inert` on background. Tabbing escapes the modal. | 503, 516, 528, 548, 922 | HIGH |
| S-3 | **Sticky-layer collision.** `nav#sb` top:0, `#config-bar` top:0 z:50, `.tab-bar` top:45px z:40, `#ds-step-nav` top:88px z:35. `scroll-margin-top:90px` likely exceeded. | 80, 99, 149, 484 | HIGH |
| S-4 | **9 banners can stack vertically** with no max-height or dismissal. On a 560 px phone this is most of the viewport. | 851–919 | HIGH |
| S-5 | **Form labels are sibling `<div>`s, not `<label for="…">`** — `aria-label` is present but mobile screen readers can't focus via the visible label. | 666–828 | MED |
| S-6 | **Heading hierarchy skips levels.** Each tab has its own `<h2>` with no parent wrapper. | 610, 633, 905, 1107+ | MED |
| S-7 | **Buttons are sometimes `<a onclick>`, sometimes `<button>`, sometimes `<div role="button">`** — keyboard/screen-reader behavior differs by tag. | 577, 830 + many | MED |
| S-8 | **Severity cells use color only** (red/yellow/green for CRITICAL/HIGH/MED/LOW) — 8% of male users can't distinguish. | 1078–1080 | MED |
| S-9 | **Modal backdrop close: `onclick="if(event.target===this)closeX()"`** — children with no interactive elements bubble to the overlay and close the modal unexpectedly. | 516, 528, 548, 922 | LOW |
| S-10 | **No "skip to main content" link.** Keyboard users tab through ~40 sidebar items every page load. | 564–1173 | LOW |
| S-11 | **Responsive breakpoints skip 1024 px (iPad).** Jumps 1400 → 900 → 560. iPad landscape gets the desktop 3-column grid. | 33–34, 64 | LOW |
| S-12 | **Duplicate `.tab-bar` rule** at lines 149 and 159. | 149, 159 | LOW |

---

## 4. Functional / Interaction Bugs

| # | Finding | Lines | Severity |
|---|---------|-------|----------|
| F-1 | **Industry → compliance auto-link silently overwrites user's manual compliance choice.** | 12065–12078 | HIGH |
| F-2 | **`#why-fe`, `#why-be`, `#why-ci`, `#why-reg` panels start `display:none` and JS only sets `innerHTML`, never the display property.** Users never see the rationale. | 12210–12213, CSS 45 | HIGH |
| F-3 | **~20 `getElementById(...).style/.textContent/.classList` calls with no null guard** — any render-order glitch turns into a console error and a dead button. | 8122–8130, 10243–10244, 10354, 12365–12372, 12410–12416, 12710–12751 | HIGH |
| F-4 | **Wizard generates inline `onchange="WIZARD_STATE['${step.key}']='${o.value}'"`** with no escaping. Any apostrophe breaks the wizard. | 12720–12751 | HIGH |
| F-5 | **Master-SVG node onclicks interpolated as `onclick="onSvgNodeClick('${n.id}')"`** — same escaping problem. | 8662–8680 | HIGH |
| F-6 | **Tab switching never updates `location.hash` / `history.pushState`** — back/forward, refresh, deep-linking all broken. | 11754–11770 | MED |
| F-7 | **`switchTab()` finds tab buttons by string-matching the inline `onclick` attribute** — silent break on refactor. | 11764–11769 | MED |
| F-8 | **Two `document.keydown` listeners** (lines 12402 and 12979); order-dependent behavior. | 12402, 12979 | MED |
| F-9 | **No `aria-selected` / `role="tab"` management** on tab buttons. | 11754–11770 | MED |
| F-10 | **`updatePkgMgrDropdown` silently resets to the first option** when the current pkg manager isn't valid for the new language. | 12029–12058 | MED |
| F-11 | **Stale stage-detail panel after config change.** If the selected stage doesn't exist in the new stack, detail stays open with stale content. | 12289–12290, 10958 | MED |
| F-12 | **JSZip CDN fallback is an `alert()`** instead of disabling the download button or showing inline guidance. | 11027 | MED |
| F-13 | **Industry change has no debounce** — rapid double-changes fire two `onConfigChange()` with a stale middle state. | 12065–12078 | LOW |
| F-14 | **"why" panels re-render on every config change** even when frontend/backend didn't change. | 12209 | LOW |
| F-15 | **`getConfig()` doesn't validate downstream invariants** — picking CI then switching backend can leave an invalid CI selected. | 2911–2977 | LOW |

---

## 5. Net diagnosis

The product is fundamentally good — the *content* (5 phases × 14 stages × 20 invariants across 6 CI systems and 9 registries) is rich and well-thought-out. **The UI just doesn't respect the user's time or attention.**

Three structural fixes would change the experience more than any visual polish:

1. **Push education down, pull action up.** Config bar → primary content first; concept / phase-0 / decision map become secondary sections, not the landing experience.
2. **Pick one decision-flow.** Five overlapping pickers is the single biggest source of "which one do I use?" confusion.
3. **Enforce the design tokens you already have.** The `:root` block is good; the inline styles ignore it. Convert the 513 inline `style=`s into ~30 classes and the visual chaos largely disappears.

See `REFACTOR_PLAN.md` for the 27-ticket execution plan organized into 4 phases.
