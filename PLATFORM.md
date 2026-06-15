# Yarova Pipeline Studio — Platform Engineering

**What this is:** the studio (knowledge for all stacks) + real golden repos (the platform-engineered code).
**When to read:** to understand the product and what is built vs pending.

---

## The product, in one line

You write only your app code.
Everything else — container, CI, deploy, security, observability, integrations — is already written.
You plug in URLs and keys. It is all set.

---

## Two parts

**1. The Studio** — `app/`
Covers all 106 frameworks. Knowledge, guidance, the per-industry recipe.
Two ways in: Express (2 plain questions) or Custom (full control).
It links to the real services and explains every choice.

**2. The Services** — `services/`
Real, runnable golden repos. One per chosen framework.
Each: app + auth + ORM + observability + Dockerfile + CI + Helm + Kustomize + compliance.
A developer writes app code and sets URLs/keys. Nothing else.

---

## How one repo serves all industries

~90% of a repo is common.
The industry only flips a few values.

The swap surface: `services/<name>/compliance/*.yaml`.
Example — Healthcare picks `hipaa.yaml`: audit logging on, 15-min session timeout, MFA, PHI-scan in CI.
Example — Finance picks `pci.yaml`: cardholder controls, stronger crypto, FIPS base.

The studio reads these and shows the recipe for the chosen industry.

---

## Integrations — connect to everything

The studio knows 38 external systems across industries.
CRM (Salesforce), payments (Stripe, Plaid), EHR (Epic/Cerner), identity (GCKey), ITSM (ServiceNow), ERP (SAP), and more.

Each golden repo carries integration wiring per system:
- A placeholder client + an example endpoint call.
- The config the developer fills in (base URL, auth, keys).
- The auth pattern (OAuth, API key, mTLS) for that system.

Status: integration knowledge is in the studio. Repo wiring is in progress.

---

## Build status — the 22 target

| Status | Frameworks |
|---|---|
| ✅ Verified (build + container + run) | Angular SSR, Next.js, FastAPI |
| In progress | React, NestJS, Gin, Expo, Hono, gRPC (core), then 13 extended |
| 🕓 Platform team yet to build | the other ~84 frameworks |

The studio shows every framework.
A framework with no golden repo shows: "platform team yet to build."

---

## Repo structure

```
app/         the Studio (Svelte) — deployed to Cloudflare Pages
services/    real golden repos (one folder per framework)
functions/   Cloudflare Pages auth gate
.github/     deploy workflow
```

Removed: `site/` (old static app), `dist/` (stale build) — dead, not deployed.

---

## Verification bar (every service)

`npm/pip build` green · `docker build` green · container runs · `/health` answers.
Verified locally with Docker. No claim without real output.
