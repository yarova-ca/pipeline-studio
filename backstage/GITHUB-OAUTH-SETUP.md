# GitHub OAuth App — Backstage Setup

**What this covers:** Creating the GitHub OAuth App that lets Backstage authenticate users.

**When to read:** Before running `npm run dev` for the first time.

---

## What You Need Before Starting

- Access to the yarova-ca GitHub organization settings.
- Admin role on the org (or ask Rohith to create the app).

---

## Step 1 — Open the OAuth App creation page

Go to this exact URL:

```
https://github.com/organizations/yarova-ca/settings/applications/new
```

When not a member: go to your personal settings instead.

```
https://github.com/settings/applications/new
```

---

## Step 2 — Fill in the form

Use these exact values.

| Field | Value |
|---|---|
| Application name | Pipeline Studio Portal |
| Homepage URL | http://localhost:3000 |
| Application description | Backstage developer portal for pipeline-studio |
| Authorization callback URL | http://localhost:7007/api/auth/github/handler/frame |

The callback URL is case-sensitive and must be exact.

Wrong callback URL: the login flow silently fails.

---

## Step 3 — Click "Register application"

GitHub creates the app and shows the app detail page.

---

## Step 4 — Copy Client ID

The Client ID is visible immediately on the app detail page.

Copy the value. It looks like: `Ov23liABCDEFGHIJ1234`

---

## Step 5 — Generate Client Secret

Click **Generate a new client secret**.

GitHub shows the secret once. Copy it immediately.

It looks like: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`

When you leave the page: the secret is hidden forever.

When you lose it: delete and generate a new one.

---

## Step 6 — Export the environment variables

Run these three commands in the terminal where you will run Backstage.

```bash
export GITHUB_TOKEN=ghp_your_personal_access_token_here
export AUTH_GITHUB_CLIENT_ID=your_client_id_here
export AUTH_GITHUB_CLIENT_SECRET=your_client_secret_here
```

`GITHUB_TOKEN` is a personal access token (PAT), not the OAuth secret.

**To create a PAT:**

Go to: `https://github.com/settings/tokens/new`

Required scopes: `read:org`, `repo` (read-only is enough for catalog discovery).

---

## Step 7 — Start Backstage

```bash
cd pipeline-studio-portal
npm run dev
```

---

## What You See When It Works

Backstage opens at `http://localhost:3000`.

The login page shows a **Sign in with GitHub** button.

After clicking: GitHub OAuth consent screen appears.

After approving: redirected back to Backstage catalog.

---

## What You See When It Fails

| Error | Cause | Fix |
|---|---|---|
| "redirect_uri_mismatch" on GitHub | Callback URL does not match | Set callback to exactly: `http://localhost:7007/api/auth/github/handler/frame` |
| Blank screen at `http://localhost:3000` | Frontend not started | Wait 30s — Backstage takes time to compile on first run |
| "401 Unauthorized" in catalog | `GITHUB_TOKEN` missing or expired | Export a fresh PAT and restart `npm run dev` |
| "0 entities" in catalog | Token lacks `read:org` scope | Regenerate PAT with `read:org` scope |
| "Failed to start backend" in terminal | `POSTGRES_*` vars not set | Run with SQLite (see below) or start docker-compose first |

---

## SQLite fallback — skip PostgreSQL for local dev

Edit `app-config.yaml` backend.database section:

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
```

When to use: local browser-only testing, no Docker.

When not to use: if you need catalog data to persist across restarts.

---

## Verify the setup is working

Run this after `npm run dev` starts:

```bash
curl -s http://localhost:7007/api/catalog/entities | head -c 200
```

When working: returns a JSON array starting with `[{`.

When broken: returns an error message or empty array.
