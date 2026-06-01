# Backstage — Pipeline Studio Developer Portal

**What this covers:** How to run Backstage locally and connect it to the pipeline-studio catalog.

**When to read:** Before setting up the developer portal for the first time.

---

## What Backstage Is

Backstage is a developer portal — one UI for all services, docs, and CI status.

It replaces scattered READMEs, Confluence pages, and tribal knowledge.

**For pipeline-studio it provides:**
- A catalog of all 106 service starters with ownership and metadata.
- TechDocs rendering the 17 HTML documentation pages as searchable docs.
- Scaffolder templates for spinning up new services from the reference starters.
- CI/CD status from GitHub Actions per service.

---

## Run Backstage Locally

### Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Node.js | 18.x or 20.x LTS | `node --version` |
| npm | 8+ | `npm --version` |
| git | any | `git --version` |

### Step 1 — Create the Backstage app

```bash
npx @backstage/create-app@latest --skip-install
```

When prompted:

```
Enter a name for the app [required]: pipeline-studio-portal
```

### Step 2 — Install dependencies

```bash
cd pipeline-studio-portal
npm install
```

### Step 3 — Copy the config

```bash
cp /path/to/pipeline-studio/backstage/app-config.yaml ./app-config.yaml
```

### Step 4 — Set environment variables

```bash
export GITHUB_TOKEN=ghp_your_token_here
export AUTH_GITHUB_CLIENT_ID=your_oauth_app_client_id
export AUTH_GITHUB_CLIENT_SECRET=your_oauth_app_client_secret
```

**To get a GitHub OAuth app:**
1. Go to github.com → Settings → Developer settings → OAuth Apps.
2. New OAuth App.
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:7007/api/auth/github/handler/frame`

### Step 5 — Run

```bash
npm run dev
```

Opens at `http://localhost:3000`.

---

## How the Catalog Connects

Backstage reads `catalog-info.yaml` files from every service repo.

**Flow:**

1. `backstage/catalog/all.yaml` is the master entry point.
2. It lists URLs to `catalog-info.yaml` in every service directory.
3. Backstage fetches those files via the GitHub integration (uses `GITHUB_TOKEN`).
4. Each `catalog-info.yaml` registers the service as a `Component` in the catalog.

**Local development without GitHub:**

Replace the `locations` block in `app-config.yaml` with:

```yaml
catalog:
  locations:
    - type: file
      target: ../../backstage/catalog/all.yaml
```

Then add file-type targets pointing to local paths in `all.yaml`.

---

## How TechDocs Works

TechDocs renders Markdown (and HTML) documentation pages inside Backstage.

**For pipeline-studio:**

The 17 `.html` pages in the repo root are the documentation source.

To make them appear in TechDocs:
1. Add a `mkdocs.yml` at the root of the repo (or service repo).
2. TechDocs generator converts it to a static site.
3. Backstage serves it under the **Docs** tab of the catalog entity.

**Quick setup — mkdocs.yml:**

```yaml
site_name: Pipeline Studio
docs_dir: .
nav:
  - Home: index.html
  - Framework Catalog: 01-framework-catalog.html
  - Pipeline Schema: 02-pipeline-schema.html
  - Stage Types: 03-stage-types.html
  - Tool Catalog: 04-tool-catalog.html
  - Invariants: 05-invariants.html
  - Industry Schema: 06-industry-schema.html
  - Canada Schema: 07-canada-schema.html
  - Canada Market: 08-canada-market.html
  - Linux Distros: 09-linux-distros.html
  - Linux Compliance: 10-linux-compliance.html
  - Dockerfile Catalog: 11-dockerfile-catalog.html
  - Compliance Variations: 12-compliance-variations.html
  - Pipeline Build Catalog: 13-pipeline-build-catalog.html
  - Canada Industry Catalog: 14-canada-industry-catalog.html
  - Version Registry: 15-version-registry.html
  - Maintainability Runbook: 16-maintainability-runbook.html
  - Feature Matrix: 17-feature-matrix.html
```

**TechDocs builder setting in app-config.yaml:**

`builder: local` — generates docs on the fly, no external storage needed for development.

---

## Scaffolder Templates

Three templates ship in `backstage/templates/`:

| Template | What it creates |
|---|---|
| `backend-service` | New backend service with health, auth, ORM, CI/CD, Helm, Kustomize |
| `frontend-spa` | New SPA with a chosen frontend framework |
| `grpc-service` | New gRPC service with proto definition and server stub |

**To use a template:**
1. Open Backstage at `http://localhost:3000`.
2. Click **Create** in the left sidebar.
3. Choose a template.
4. Fill in the parameters.
5. Backstage creates the GitHub repo and registers it in the catalog.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Catalog shows 0 entities | `GITHUB_TOKEN` not set | Export the token and restart |
| Auth redirect fails | Wrong OAuth callback URL | Set callback to `http://localhost:7007/api/auth/github/handler/frame` |
| TechDocs tab missing | No `techdocs-ref` annotation | Add annotation to `catalog-info.yaml` |
| Port 7007 in use | Another process | Kill it: `lsof -ti:7007 \| xargs kill` |
