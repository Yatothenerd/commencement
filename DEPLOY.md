# Deploying to Vercel

This project is a **static site + serverless functions** (the local `server.js`
is for local dev only — Vercel ignores it).

## 1. Root Directory  ← most common cause of a blank page
`index.html` must be at the deployment's root. In Vercel:

**Project → Settings → General → Root Directory**

Set it to the folder that directly contains `index.html` (this `WEB` folder).
If Vercel is pointed at a parent folder, the site comes up blank. Redeploy after changing.

## 2. Project settings
- **Framework Preset:** Other
- **Build Command:** (leave empty)
- **Output Directory:** (leave empty)
- **Install Command:** `npm install` (default)

## 3. Environment Variables
`.env.local` is git-ignored and never uploaded, so set these in Vercel:

**Project → Settings → Environment Variables**

| Name           | Value                                   |
|----------------|-----------------------------------------|
| `DATABASE_URL` | your Neon connection string             |
| `ADMIN_TOKEN`  | (optional) a long random string         |

Redeploy after adding them. Without `DATABASE_URL`, the admin and the
short-link guest lookups won't work.

## 4. Routes (handled by vercel.json — already included)
- `/`            → invitation
- `/admin`       → admin dashboard
- `/123456`      → invitation for that 6-digit guest code
- `/api/guest`   → single-guest lookup (function)
- `/api/guests`  → admin CRUD (function)

## Quick check
- `https://<app>.vercel.app/index.html` works but `/` is blank → Root Directory / rewrite issue.
- Even `/index.html` is blank → Root Directory is wrong (no index.html at root).
- Page loads but admin/guests fail → `DATABASE_URL` not set.
