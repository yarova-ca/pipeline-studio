# Pipeline Studio — Refactor Plan

> Single source of truth for fixing the UX, structural, and maintainability problems in `index.html`. Check off tickets as they ship. Any future session can pick up from here without re-running the audit.

---

## Diagnosis (read this first)

`index.html` is a 13k-line single-file app. It works, but it feels yuck for two reasons:

1. **Two styling systems fight each other.** `:root` design tokens are defined and ignored — the body has **513 inline `style="..."` attributes**, **41 background colors**, **21 font sizes**, **13 border radii**, **11 ad-hoc z-index values**, **12+ button styles**. Nothing looks like it belongs to the same product.
2. **The critical path is buried.** A first-time user wants *pick stack → see YAML*. The page delivers ~1,200–1,500 px of conceptual scaffolding, **3 competing navs** (sidebar + sticky top + right TOC), **9 dropdowns with no grouping**, **9 stackable banners**, **5 different ways to "pick decisions"** (wizard, decision map, decision-picker modal, phase-context bar, phase 0). Then the YAML.

On top of that, **functional bugs** make it feel broken: `#why-*` panels never become visible despite being populated, industry-change silently overwrites manual compliance choice, tab switching loses state on refresh, ~20 unguarded DOM lookups, unescaped string interpolation in wizard `onchange` and SVG `onclick`.

**The fix is not cosmetic polish.** It's three structural moves: push education down (pull action up), pick ONE decision flow, and enforce the design tokens you already have.

---

## How to use this doc

- Phases ship independently. **Don't start Phase 2 until Phase 1 is done.**
- Each ticket has: severity, files & lines, the fix in one line, acceptance criteria.
- When you complete a ticket, change `[ ]` to `[x]` and commit. The diff is your progress log.
- File references use `index.html:LINE`.

---

## Phase 0 — Quick wins (≤ 1 day, ship first)

These are small, high-impact, low-risk. They fix the most visible "yuck" and unblock real testing.

- [x] **P0-1 · Fix invisible `#why-*` panels** *(HIGH)* — commit `22cfb2a`
  - Problem: `#why-fe/#why-be/#why-ci/#why-reg` start `display:none`. JS sets `innerHTML` but never sets display.
  - Files: `index.html:45, 12210–12213`
  - Fix: In `onConfigChange`, after setting innerHTML, set `el.style.display = el.innerHTML.trim() ? '' : 'none'`.
  - Accept: Picking a frontend/backend/CI/registry causes the matching "why" panel to appear with the rationale.

- [x] **P0-2 · Stop industry change overwriting manual compliance** *(HIGH)* — commit `c501ace`
  - Problem: `onIndustryChange()` resets compliance to the industry default even when the user already chose one.
  - Files: `index.html:12065–12078`
  - Fix: Track whether compliance was user-set (data attribute or state flag); only auto-link when it's still `'none'` AND user hasn't explicitly chosen.
  - Accept: Manually pick PCI-DSS → switch industry to Healthcare → compliance stays PCI-DSS. Flash message offers a one-click switch instead.

- [x] **P0-3 · Escape interpolated values in inline handlers** *(HIGH)* — commit `edffe71`
  - Problem: Wizard `onchange="WIZARD_STATE['${step.key}']='${o.value}'"` and SVG `onclick="onSvgNodeClick('${n.id}')"` break silently if any value contains `'`.
  - Files: `index.html:8662–8680, 12720–12751`
  - Fix: Replace with `addEventListener` + dataset, OR run values through a small `escapeJsString()` helper.
  - Accept: A wizard option value or SVG node id containing `'` no longer breaks the handler (add a self-test case).

- [x] **P0-4 · Add null-guards to the ~20 unsafe `getElementById` calls** *(HIGH)* — commit `96415e7`
  - Problem: `document.getElementById(x).style/.textContent/.classList` with no null check — any render-order glitch becomes a dead button.
  - Files: `index.html:8122–8130, 10243–10244, 10354, 12365–12372, 12410–12416, 12710–12751`
  - Fix: Introduce a `function $(id){ return document.getElementById(id); }` helper, OR wrap each access in `const el = document.getElementById(...); if (!el) return;`.
  - Accept: Open every modal + every collapsible section in dev tools with one target element removed — nothing throws.

- [x] **P0-5 · Sync tab to URL hash + restore on load** *(MED)* — commit `4b42381`
  - Problem: Tab clicks don't update `location.hash`; back/forward and refresh lose the tab.
  - Files: `index.html:11754–11770`
  - Fix: In `showTab`, set `history.replaceState(null, '', '#' + tabId)`. On `DOMContentLoaded`, read `location.hash` and call `showTab` if present.
  - Accept: Pick the "Promotions" tab, refresh — Promotions still selected. Back button returns to previous tab.

- [x] **P0-6 · Collapse 4 warning banners into 1 dismissable callout** *(HIGH for UX)* — commit `60d2923`
  - Problem: `mobile-warning`, `nextjs-warning`, `comingsoon-banner`, `industry-context` can stack to ~100+ px of vertical "shouting" above the fold.
  - Files: `index.html:851, 854, 869, 879`
  - Fix: One `#alerts-strip` `<details>` with a single summary like "Alerts for this combo (3)". Render messages inside as a list. Add a dismiss-for-session button.
  - Accept: Worst-case viewport above the tab content drops by ≥ 80 px.

- [x] **P0-7 · Remove duplicate `.tab-bar` CSS rule** *(LOW)* — commit `fc39522`
  - Problem: Identical sticky/top/z-index declared twice.
  - Files: `index.html:149, 159`
  - Fix: Delete the duplicate.
  - Accept: One `.tab-bar` rule remains; visual output unchanged.

- [x] **P0-8 · Move Advanced selects behind an expander** *(HIGH for UX)* — commit `d238333`
  - Problem: 9 selects look equally important. Mode / Industry / Package Manager are power-user toggles.
  - Files: `index.html:664–828`
  - Fix: Keep Frontend / Backend / CI / Registry / Compliance visible. Put Package Manager / Industry / Mode behind a "More options" `<details>` in the config bar.
  - Accept: Config bar shows 5 selects by default on desktop; the rest open with one click. State persists across reloads.

---

## Phase 1 — Structural fixes (2–4 days, the root causes)

This is where the "feels broken" goes away.

- [x] **P1-1 · Single z-index ladder** *(MED)* — commit `306c66c`
  - Problem: 11 ad-hoc z-index values, two modals tied at 200, no system.
  - Files: `index.html:11` (`:root`), all overlay/modal styles
  - Fix: Add tokens `--z-sticky:50; --z-overlay:100; --z-drawer:150; --z-modal:200; --z-modal-on-modal:250; --z-toast:300;`. Replace every numeric z-index.
  - Accept: Grep for `z-index:` outside `:root` returns 0 numeric values. Opening any two overlays stacks correctly.

- [x] **P1-2 · Modal semantics + focus trap** *(HIGH for a11y)* — commit `215a1dd`
  - Problem: 5 modals (wizard, quick-find, decision-picker, threat-tour, context-drawer) have no `role="dialog"`, no `aria-modal`, no focus trap, no `inert` on background.
  - Files: `index.html:503, 516, 528, 548, 922`
  - Fix: Add `role="dialog" aria-modal="true" aria-labelledby="..."`. On open, save `document.activeElement`, focus first focusable inside modal, trap Tab inside until close, restore focus on close. Set `inert` on `<main>` while modal open.
  - Accept: Keyboard-only user can't tab out of a modal; closing returns focus to the trigger; screen reader announces "dialog".

- [~] **P1-3 · One decision flow** *(HIGH for UX)* — PARTIAL (commit `fea8642`) — Setup-wizard CTA hidden from config bar so Decision Map is the single visible entry. Wizard code retained + reachable via `W` shortcut. Full wizard deletion vs. fold-into-map is a product decision still pending
  - Problem: Wizard modal + Decision Map + Decision-Picker modal are three UIs for the same task.
  - Files: `index.html:528–546` (wizard), `915` (decision-map), `922–940` (decision-picker)
  - Decide one of:
    - **(A)** Keep on-page Decision Map. Delete wizard modal. Add a "Quick path (7 questions)" button that scrolls to + auto-advances the decision map.
    - **(B)** Keep wizard modal. Delete decision map. Make wizard reopenable to edit any answer.
  - Recommend **(A)** — on-page beats modal for content-heavy choices.
  - Accept: One primary entry point for picking config. The other UI is gone. All existing functionality still reachable.

- [x] **P1-4 · Hide inactive tab panels** *(HIGH)* — REINTERPRETED (commit `0d95ce7`) — audit misread the design; tabs are intentionally scroll-to-section, all visible. Removed dead `.tab-content.active` selector + added comment codifying intent. No behavior change
  - Problem: `.tab-content { display:block }` and `.tab-content.active { display:block }` are identical. Either JS is hacking visibility some other way or all tabs render at once.
  - Files: `index.html:156–157`
  - Fix: Change base rule to `display:none`. Verify `showTab` adds/removes `.active` correctly. Audit any code that assumes a hidden tab is in the layout.
  - Accept: Only one tab is in the layout at a time. Performance + DOM size improve.

- [x] **P1-5 · Add `aria-selected` + `role="tab"` + `role="tabpanel"`** *(MED)* — REINTERPRETED (commit `e91afe6`) — no `.tab-btn` elements exist; correct fix for this scroll-anchor pattern is `role="region"` + `aria-label` on each section (14 added). `aria-current="location"` wired into scrollspy for any future tab-bar
  - Problem: No ARIA on the tab bar — screen reader users can't tell which tab is active.
  - Files: `index.html:11754–11770` (showTab), tab-bar HTML
  - Fix: Tab buttons get `role="tab"`, panels get `role="tabpanel"` + `aria-labelledby`. On switch, set `aria-selected="true"` on active button, `false` on others.
  - Accept: NVDA / VoiceOver announces "Tab 3 of 14, Promotions, selected".

- [ ] **P1-6 · Replace inline `onclick` with event delegation** *(MED)* — DEFERRED — high-risk migration of 59 onclick sites for limited ROI now that P0-3 fixed the two interpolation-prone sites. The `switchTab` string-search is dead code (no `.tab-btn` HTML exists). Revisit if/when re-introducing a real tab bar
  - Problem: 59 inline `onclick=` vs 4 `addEventListener` — no consistent model, fragile to refactor (see P0-3 escaping bug).
  - Files: `index.html` body + script block
  - Fix: One delegated listener on `document` reading `data-action`. Migrate in batches by feature area (tabs, modals, decision picker, wizard).
  - Accept: New buttons are added with `data-action`, not `onclick`. The string-search trick in `switchTab` (line 11764) is removed in favor of `data-tab`.

- [ ] **P1-7 · Single source of truth for config state** *(MED)* — DEFERRED — substantial refactor touching `getConfig`, every onChange handler, every renderer. Needs human-in-loop review per step; not safe to do autonomously without browser regression coverage. Recommend doing in dedicated session
  - Problem: Config is read off `.value` of selects scattered through code; tab re-renders are inconsistent.
  - Files: `index.html:2911–2977` (getConfig), all onChange handlers
  - Fix: A `state.config` object updated only via `setConfig({key, value})`, which validates downstream invariants (e.g. selected CI valid for backend) and dispatches a single `'config:change'` event. All renderers subscribe.
  - Accept: Picking a backend that doesn't support the current CI shows a one-line toast and resets CI to a valid default (no silent corruption).

- [x] **P1-8 · Sticky-header collision audit** *(MED)* — commit `fc05dbe`
  - Problem: `nav#sb` top:0, `#config-bar` top:0 z:50, `.tab-bar` top:45px z:40, `#ds-step-nav` top:88px z:35. `scroll-margin-top:90px` likely exceeded.
  - Files: `index.html:80, 99, 149, 156, 484`
  - Fix: Decide the stacked-header total height per breakpoint. Set `scroll-margin-top` to that value as a CSS variable. Stop using both top:0 elements on mobile.
  - Accept: Click any TOC anchor — target lands fully below all sticky headers, never under them.

---

## Phase 2 — Visual consistency (3–5 days, design system enforcement)

This is where it stops looking like a Frankenstein.

- [x] **P2-1 · Extend design tokens** *(HIGH)* — commit `8a47ef4`
  - Files: `index.html:11–29` (`:root`)
  - Add tokens for: font-size scale (`--fs-xs / sm / base / md / lg / xl / 2xl`, 5–7 values max), font-weight (`--fw-regular / medium / semibold / bold`), spacing scale (`--sp-1 … --sp-8` mapping to 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 px), line-height (`--lh-tight / base / loose`), elevation `--sh-1 / 2 / 3`, semantic backgrounds `--bg-note-info / warn / success / danger / compliance`.
  - Accept: A "design tokens" comment block in `:root` documents the whole scale.

- [ ] **P2-2 · Eliminate inline styles in `<body>`** *(HIGH)* — DEFERRED — 513-site mechanical migration; each touched style needs visual regression check that requires a browser. Tokens (P2-1) + button system (P2-4) ready; migration itself wants a session with screenshot diff coverage
  - Problem: 513 inline `style="..."` attrs make every change hurt and prevent theming.
  - Files: `index.html:500–1180`
  - Fix: Convert recurring patterns into ~30 utility/component classes (`.modal`, `.modal-hdr`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.note`, `.note-info/warn/success/danger`, `.pill`, `.kbd`, etc.). Migrate in batches by component area.
  - Accept: `grep -c 'style="' index.html` drops below 50 (target: 0 for new code).

- [~] **P2-3 · Collapse 41 colors → tokenized palette** *(HIGH)* — PARTIAL (commit `1100dab`) — 4 alert banners now use semantic `--bg-note-*` / `--br-note-*` tokens. Full migration of remaining ~30 inline colors deferred to P2-2 session
  - Problem: 3 different pale blues for "info" banners, 2 yellow-oranges for warnings, 12+ grays for text, 3 reds, 3 greens.
  - Files: throughout
  - Fix: Define one color per role (`info`, `warn`, `success`, `danger`, `compliance`, `neutral`). Map every banner / pill / badge to a role.
  - Accept: A reader can identify a banner's severity by color alone without prior context.

- [~] **P2-4 · Single button system** *(MED)* — PARTIAL (commit `8d30abb`) — `.btn` + `.btn-primary/secondary/ghost/danger/success/sm` defined in CSS. Migration of existing inline-styled buttons deferred to P2-2 session
  - Problem: 12+ ad-hoc button styles with random padding (3/7/12/16 px).
  - Files: throughout
  - Fix: `.btn` base + `.btn-primary | .btn-secondary | .btn-ghost | .btn-danger` modifiers. Sizes: `.btn-sm | .btn` only.
  - Accept: Every `<button>` and button-like `<a>` uses one of these classes. No inline color/padding overrides.

- [ ] **P2-5 · Single pill system** *(MED)* — DEFERRED — 5 pill rule sets to unify + inline pills to migrate; same regression-coverage need as P2-2
  - Problem: `.ds-pill`, `.swim-pill`, `.ds-nav-chip`, `.pb-ph-*` + inline pills — 5+ reinventions.
  - Files: `index.html:124, 256–261, 419, 486`
  - Fix: One `.pill` + role modifiers (`.pill-info`, etc.). Delete or alias the others.
  - Accept: One pill rule in CSS. Pills with the same role look identical.

- [ ] **P2-6 · Remove `!important` declarations** *(LOW)* — DEFERRED — audit itself called most "defensible" (role/mode hiding selectors + print media). Remaining handful are mobile-override workarounds whose removal needs specificity recalculation per selector
  - Problem: 15 `!important` declarations — most are specificity workarounds for compound `body.role-* .hide-from-*` selectors.
  - Files: `index.html:37–38, 43, 46–48, 77, 324–326, 337, 341, 352–353, 357, 359`
  - Fix: Restructure role/mode selectors to win on specificity naturally; reserve `!important` for `@media print` only.
  - Accept: `grep -c '!important' index.html` ≤ 5, all in print media block.

- [x] **P2-7 · Use semantic `<label for="">`** *(MED)* — commit `caf7004`
  - Problem: Form labels are sibling `<div>`s with `aria-label` on the input — mobile screen readers can't focus by tapping the label.
  - Files: `index.html:666–828`
  - Fix: Wrap each label/select pair in a flex container, use `<label for="sel-frontend">Frontend</label>`.
  - Accept: Tapping any label on iOS Safari focuses the matching select.

---

## Phase 3 — Information architecture (1+ week, the structural rethink)

Don't start until Phases 0–1 are merged.

- [ ] **P3-1 · Push education below action** — DEFERRED — reorders the entire landing experience. Product decision (what's the default landing tab? what stays vs. collapses?) — not safe to do autonomously
  - Today: hero → concept (stats + 3 cards + 2 tables) → decision map → phase 0 → **then** tab content.
  - Target: config bar → tab content (default to the user's likely starting tab) → concept/decision map/phase 0 as collapsible sections or a dedicated "Overview" tab.
  - Accept: First-time user reaches actual pipeline YAML in ≤ 1 viewport on a 1080p screen.

- [ ] **P3-2 · Merge or move overlapping tabs** — DEFERRED — content reorganization (glossary+catalog, setup→phase0, tradeoffs+mistakes). Affects render functions, TOC, scrollspy, URL hash routing. Needs your content judgment
  - `glossary` + `catalog` → single "Reference" tab with subsections.
  - `setup` → fold into Phase 0 as a registry-specific subsection.
  - `tradeoffs` + `mistakes` → single "Design & Pitfalls" tab.
  - Accept: 14 tabs → 10–11. Each tab has a single, non-overlapping purpose.

- [ ] **P3-3 · Decide the sidebar's job** — DEFERRED — strip duplicate nav vs keep as quick-link. Product decision
  - Today: sidebar duplicates top-of-page nav (Concept, Phase 0, Search) AND hosts the invariants browser.
  - Target: sidebar = invariants browser only + scope statement. Move "Search" to the config bar (already has a Quick-Find button anyway).
  - Accept: Sidebar has one job. New users can describe it in one sentence.

- [ ] **P3-4 · Terminology pass** — DEFERRED — editorial pass across 13k lines; needs human writing judgment
  - Decide canonical use of: *phase* (5 major divisions) vs *stage* (CI substeps) vs *step* (wizard/setup steps); *decision* (config choice) vs *tile* (UI element) vs *option* (alternative); *stack* (frontend+backend) vs *framework* vs *language*.
  - Files: throughout + glossary tab
  - Accept: Glossary tab defines each term once. Grep audit shows no contradictory uses.

- [ ] **P3-5 · Reconsider role modes** — DEFERRED — keep vs delete the Default/Learn/Ship/Audit modes; entirely a product call
  - Today: Default/Learn/Ship/Audit hide 1–2 tabs and tweak widths. Doesn't reduce complexity.
  - Decide: either commit to role modes as a first-class feature (heavy lift) or remove them and use sensible defaults with collapsibles.
  - Accept: Whichever path is chosen, document the rationale in this file.

---

## Tracking

- Total tickets: **27** (Phase 0: 8, Phase 1: 8, Phase 2: 7, Phase 3: 4)
- When all of Phase 0 is `[x]`, the worst "feels broken" symptoms are gone.
- When all of Phase 1 is `[x]`, the app is structurally sound — safe to invest in Phase 2/3.

## Out of scope for this plan

- Backend / generator logic (this is a UI/UX refactor only).
- Adding new stacks, CI systems, or compliance frameworks.
- Splitting the single file into multiple files — defer until after Phase 1; not a blocker.
