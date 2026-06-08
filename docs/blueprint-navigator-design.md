# Blueprint Navigator — Master Design

**What this covers:** The full redesign of the 26 HTML pages into one clarity-first navigator.
**When to read:** Before touching any HTML. Before writing the data model. Before build.

---

## 1. The problem

The blueprint exists. The clarity does not.

There are 26 HTML pages today.
Several exceed 500KB. One is 1.5MB.
Each page is a hand-written wall of tables.

There is no shared data. Each page repeats facts.
A change in one place is not reflected in another.

The matrix has many dimensions.
Frameworks. Stages. Tools. Build axes. Compliance. Industries. Clusters. Deploy. Auth. ORM. Observability. Integrations.

Working memory holds three items.
Twelve dimensions on one screen cause shutdown.

**The diagnosis:** the shape is wrong, not the styling.

---

## 2. The principle

Completeness and clarity stop fighting when they become separate views.

**Decision:** One data model. Three views. Lenses on all three.

Rejected: one mega-page with filters.
Why rejected: a single page still forces all dimensions into one layout.

Tradeoff accepted: three views cost more build effort than one page.
The cost is paid once. The clarity is permanent.

---

## 3. The three views

| View | For whom | Shows | Cognitive load |
|---|---|---|---|
| Map | Founder | Every framework × every dimension | High — full visibility on purpose |
| Guided | New user | One decision per screen | Lowest — three clicks |
| Bundle | Both | One framework, full depth | Medium — one subject |

All three read the same data file.
A change to the data updates all three.

---

### View 1 — Map (full visibility)

**Purpose:** the founder sees everything at once.

Layout: one scrollable grid.
Rows: 105 services.
Columns: every dimension.

Filter bar pins to the top.
Zoom control shrinks rows to fit more on screen.

**When a cell has data:** the value shows, color-coded.
**When a cell has no data:** a gap marker shows (⚠️), never blank.

Why the gap marker: a blank reads as "none." A marker reads as "to-do."

```
filter: [category ▾] [language ▾] [industry ▾] [compliance ▾]   zoom: [– ▭ +]

        | CI | Compliance | Deploy | Auth | ORM | Obs | Integrations |
01-nextjs| ✅ | HIPAA ⚠️   | AKS   | JWT  | ⚠️  | OTel| CRM ⚠️       |
14-express| ✅ | PCI       | EKS   | OAuth| Prisma| OTel| Salesforce |
16-echo  | ✅ | SOC2      | GKE   | JWT  | GORM | Prom| —            |
... 105 rows ...
```

---

### View 2 — Guided (zero cognitive load)

**Purpose:** a new user reaches the right bundle in three clicks.

One decision per screen. Nothing else visible.

```
Screen 1:  Pick a category.        (13 large buttons)
Screen 2:  Pick a framework.       (only that category's frameworks)
Screen 3:  Pick your industry.     (optional — skip = baseline)
Result:    The Bundle view for that exact choice.
```

A progress bar shows step N of 3.
A back arrow returns to the previous screen.

**When the user skips industry:** the baseline bundle shows.
**When the user picks an industry:** the industry-adjusted bundle shows.

---

### View 3 — Bundle (one framework, full depth)

**Purpose:** everything about ONE framework, in its selected context.

Reached from Map (click a row) or Guided (final step).

Each section is collapsible.
Default: all collapsed except Overview.

```
Express 5   ·   Industry: Healthcare (Canada)   ·   [change industry ▾]

▸ Overview          language, version, maturity, ports
▸ CI pipeline       7 phases, each stage + tool
▸ Build axes        8 axes, selected values
▸ Compliance        regimes that apply + why
▸ Deploy            cluster + GitOps + manifests
▸ Auth · ORM · Obs  selected option per axis
▸ Integrations      CRM, gateways, external systems
▸ Gaps              what is not yet defined here
```

---

## 4. The lenses

A lens re-colors all three views to one context.

Lens: a selected filter that annotates, not hides.

| Lens | Effect when applied |
|---|---|
| Industry | Shows what each industry requires + what changes |
| Compliance | Highlights regimes + the controls they force |
| Device | Filters to frameworks valid for that device class |
| Cluster | Shows the deploy path for AKS/EKS/GKE/OpenShift |
| Region | Shows region rules (Canada is the first region) |

Lenses stack.
Industry "Healthcare" + Region "Canada" = HIPAA + PIPEDA shown together.

---

### How "what changes" stays explicit

Every value carries a state color.

| Color | Meaning |
|---|---|
| Green | Same as baseline |
| Amber | Changed BY the active lens — reason shown inline |
| Red | Required but not yet defined — a gap |

**When a value is amber:** the next line states which lens changed it and why.
**When a value is green:** no reason needed — it is the default.

Why: the user never guesses why a value differs.

---

## 5. The data model

One file. The single source of truth.

Format: JSON.
Why JSON: the browser reads it directly. No build step.

The 26 pages collapse into these entities.

---

### Entity: framework

```
id            "14-express"
name          "Express 5"
category      "14-nodejs"
language      "typescript"
version       "5.x"
license       "MIT"
maturity      "tier-1"
ports         [3000]
device        ["server"]
baseline      { auth, orm, observability, runtime }
```

Source pages: 01-framework-catalog, 17-feature-matrix, 18-service-status.

---

### Entity: pipeline

```
phases        [ { id: 0, name: "Bootstrap", stages: [...] }, ... ]
stage         { id, name, type, tools: [...] }
```

Source pages: 02-pipeline-schema, 03-stage-types, 04-tool-catalog, 13-pipeline-build-catalog.

---

### Entity: buildAxis

```
id            "RUNTIME"
controls      "Base runtime image"
default       "alpine"
validValues   ["alpine","slim","fips","scratch","distroless"]
appliesTo     ["node","go","rust", ...]
```

Source page: 21-build-axes.

---

### Entity: industry

```
id            "healthcare"
vertical      "Health"
region        "CA"
tier          1
requires      { compliance: ["HIPAA","PIPEDA"], auth: "oauth2+mfa", ... }
```

Source pages: 06-industry-schema, 07-canada-schema, 14-canada-industry-catalog.

---

### Entity: compliance

```
id            "HIPAA"
region        ["US","CA-equivalent"]
forces        { observability: "audit-logging", data: "encryption-at-rest", ... }
runtimeImage  "fips"
```

Source pages: 10-linux-compliance, 12-compliance-variations.

---

### Entity: cluster

```
id            "openshift"
provider      "Red Hat"
gitops        ["argo","helm","kustomize"]
industryFit   ["healthcare","government"]
```

Source pages: 19-cluster-setup, 23-deployment.

---

### Entity: invariant

```
id            "INV-01"
rule          "COMPLIANCE=fips requires RUNTIME=fips"
appliesTo     ["all"]
```

Source page: 05-invariants.

---

### The overlay function

The lens result is computed, not stored.

```
bundle(framework, industry, region) =
    baseline(framework)
    + apply(industry.requires)
    + apply(region.rules)
    + flagChanges()
    + flagGaps()
```

**When a required field has no value:** flagGaps marks it red.
**When a field is overridden by a lens:** flagChanges marks it amber + reason.

---

## 6. Gap handling — the honesty rule

A hidden gap is a lie. A shown gap is a to-do.

Every view computes coverage from the data.

**When framework×industry data exists:** the slice shows in full.
**When it is missing:** the view shows ⚠️ "gap — not yet defined."

A coverage counter shows on the Map.
Example: "Healthcare: 78 of 105 frameworks fully defined."

Why the counter: the founder sees true completeness, not assumed.

---

## 7. The dimension inventory

All 26 pages map into the model. Nothing is dropped.

| Old page | Becomes |
|---|---|
| 00-getting-started | Guided view intro screen |
| 01-framework-catalog | framework entities + Map rows |
| 02-pipeline-schema | pipeline entity |
| 03-stage-types | pipeline.stages |
| 04-tool-catalog | stage.tools |
| 05-invariants | invariant entities + validation |
| 06-industry-schema | industry entities (US) |
| 07-canada-schema | industry entities (CA) |
| 08-canada-market | industry.market fields |
| 09-linux-distros | runtime image options |
| 10-linux-compliance | compliance.runtimeImage |
| 11-dockerfile-catalog | buildAxis + Bundle deploy |
| 12-compliance-variations | compliance.forces |
| 13-pipeline-build-catalog | Bundle CI section |
| 14-canada-industry-catalog | industry entities (CA detail) |
| 15-version-registry | framework.version |
| 16-maintainability-runbook | Bundle maintain section |
| 17-feature-matrix | Map columns |
| 18-service-status | framework.maturity |
| 19-cluster-setup | cluster entities |
| 20-local-dev | Bundle run-locally section |
| 21-build-axes | buildAxis entities |
| 22-add-a-service | Guided "create" link to Backstage |
| 23-deployment | cluster.gitops + Bundle deploy |
| 24-debugging | Bundle troubleshoot section |

---

## 8. Screen specification

---

### Home

One screen. Three large entry buttons.

```
Pipeline Studio — one-stop clarity

[ Explore the Map ]     full visibility — every framework, every axis
[ Guided setup ]        three clicks to your exact bundle
[ Browse a framework ]  jump straight to one service
```

A lens bar sits under the buttons.
Selecting a lens carries into whichever view opens.

---

### Map screen

Top: filter bar + lens bar + zoom + coverage counter.
Body: the grid (105 rows × dimension columns).

Click a row → Bundle view for that framework.
Click a column header → sort by that dimension.

**When a filter is active:** only matching rows show. Count updates.
**When no rows match:** an empty-state line shows "0 of 105 — widen filters."

---

### Guided screens

Three sequential screens. One decision each.
Covered in section 3, View 2.

---

### Bundle screen

Header: framework name + active lens + change-lens control.
Body: collapsible sections from section 3, View 3.

A "View in Backstage" button links to the live catalog entity.
Why: the HTML is clarity. Backstage is the real code. They connect.

---

## 9. Visual + interaction rules

These keep the navigator inside the clarity standard.

- One decision per Guided screen. No exceptions.
- Map is the only view allowed to show everything at once.
- Every cell is green, amber, or red. No fourth state.
- Every amber cell has a reason on hover + on the Bundle page.
- No page loads more than the one data file.
- No horizontal scroll on Guided or Bundle. Map allows it.

---

## 10. Failure modes

---

**If the data file fails to load:**

Trigger: the JSON is missing or malformed.

System: the navigator shows a single error card.
No view renders.

User sees: "Blueprint data failed to load. Check data.json."

User can: open the browser console for the parse error.
To restore: fix the JSON, reload.

---

**If a framework has no baseline:**

Trigger: a framework entity is missing required fields.

System: that row shows all-red on the Map.
The Bundle page shows a gap list.

User sees: "⚠️ baseline not defined for this framework."

User can: add the missing fields to the data file.

---

**If a lens references an undefined industry:**

Trigger: a lens points to an industry id not in the data.

System: the lens bar disables that option.

User sees: the industry is greyed out, not selectable.

User can: add the industry entity, then it becomes selectable.

---

## 11. Build plan

Test first. One step per session. Each step has a 60-second check.

| Step | Ships | Verify |
|---|---|---|
| B1 | Extract all 26 pages into data.json | JSON parses. 105 frameworks present. |
| B2 | Map view renders from data.json | 105 rows, all columns, filters work. |
| B3 | Bundle view renders one framework | All sections show. Gaps flagged. |
| B4 | Guided view — 3 screens | Three clicks reach a Bundle. |
| B5 | Industry lens on all three | Amber + reason show for changed values. |
| B6 | Compliance + cluster + region lenses | Lenses stack. Coverage counter correct. |
| B7 | Gap audit | Every undefined cell is red, none blank. |
| B8 | Backstage links | Each Bundle links to its catalog entity. |

---

## 12. Open questions

---

**Q1. Where does the data file live?**
Status: DECIDED.
Decision: one `data.json` at the HTML root.
Why: zero build step. The browser fetches it directly.

---

**Q2. Do we keep the 26 old pages during transition?**
Status: FOUNDER.
If keep: old links work while the navigator is built.
If drop: a clean break, no stale pages.
Blocks: the index.html hub rewrite.

---

**Q3. Is Canada the only region at launch?**
Status: DECIDED.
Decision: Canada first. Region is a lens, so more regions add later.
Why: the data model already keys compliance + industry by region.

---

**Q4. How is data.json kept in sync with real code in Backstage?**
Status: TECH.
Owner: next phase, after the HTML is done.
Resolution path: generate data.json from the same source the catalog uses.
What it blocks: long-term drift between HTML clarity and real code.
