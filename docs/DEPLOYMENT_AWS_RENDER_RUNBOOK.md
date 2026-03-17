# Deployment Runbook: New Environment on AWS and Render

## Purpose
This runbook provides step-by-step instructions to deploy a new environment of this project to:
- AWS (recommended path: App Runner services)
- Render (two web services: backend + frontend)

It is written for repeatable environment creation (for example: dev, staging, pre-prod).

## Architecture Used by This Repo
- Backend: Node/Express service on port 3001 (`backend/server.js`)
- Frontend: React build served by Node server on port 8080 with `/api` proxy (`frontend/server.js`)
- Frontend-to-backend communication:
  - Browser calls frontend service
  - Frontend service proxies `/api/*` to backend via `BACKEND_BASE_URL`

## Environment Naming Convention (Recommended)
- `insurance-dev`
- `insurance-staging`# Deployment Runbook: New Environment on AWS and Render

## Purpose
This runbook provides step-by-step instructions to deploy a new environment of this project to:
- AWS (recommended path: App Runner services)
- Render (two web services: backend + frontend)

It is written for repeatable environment creation (for example: dev, staging, pre-prod).

## Architecture Used by This Repo
- Backend: Node/Express service on port 3001 (`backend/server.js`)
- Frontend: React build served by Node server on port 8080 with `/api` proxy (`frontend/server.js`)
- Frontend-to-backend communication:
  - Browser calls frontend service
  - Frontend service proxies `/api/*` to backend via `BACKEND_BASE_URL`

## Environment Naming Convention (Recommended)
- `insurance-dev`
- `insurance-staging`
- `insurance-prod`

Use one consistent suffix everywhere (service names, domains, secrets, tags).

---

## Prerequisites

### Accounts and Access
- AWS account with permissions for App Runner, ECR (if using image flow), IAM, CloudWatch, Route53/ACM
- Render account with permission to create web services and custom domains
- Access to the Git repository

### Required Secrets / Values
- `JWT_SECRET` (generate a strong random value)
- Environment domain plan (for example `staging.example.com`)

### Local Tooling (for optional validation)
- Node.js 20+ (frontend runtime), Node.js 22 compatible (backend runtime)
- Docker (optional)
- AWS CLI (optional for CLI-based verification)

### Repository Bootstrap
Run this before starting AWS or Render setup:

```bash
git clone https://github.com/yossi-f5/insurance-api-testing.git
cd insurance-api-testing
```

---

## Section A: Deploy New Environment to AWS (App Runner)

This repo already includes App Runner configuration files:
- `backend/apprunner.yaml`
- `frontend/apprunner.yaml`

### A1. Create Backend App Runner Service
1. Open AWS Console -> App Runner -> Create service.
2. Source:
   - Source code repository (GitHub/CodeCommit)
   - Select repository and branch for the target environment.
3. Service settings:
   - Service name: `insurance-backend-<env>`
   - Runtime: Node.js
   - Port: 3001
4. Build and start commands (if not auto-read from `apprunner.yaml`):
   - Build: `npm ci --omit=dev`
   - Start: `npm start`
5. Environment variables:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `JWT_SECRET=<strong-secret>`
6. Health check:
   - Path: `/api/health`
7. Deploy and wait until status is Running.
8. Copy backend service URL (example: `https://insurance-backend-staging.<id>.<region>.awsapprunner.com`).

### A2. Create Frontend App Runner Service
1. Create second App Runner service.
2. Source:
   - Same repository and target branch.
   - Root directory: `frontend`.
3. Service settings:
   - Service name: `insurance-frontend-<env>`
   - Runtime: Node.js
   - Port: 8080
4. Build and start commands:
   - Build: `npm ci && npm run build`
   - Start: `npm start`
5. Environment variables:
   - `NODE_ENV=production`
   - `PORT=8080`
   - `BACKEND_BASE_URL=<backend service URL from A1>`
6. Health check:
   - Path: `/health`
7. Deploy and verify status is Running.

### A3. AWS Post-Deployment Validation
Run these checks from terminal:

```bash
curl -sS https://<backend-url>/api/health
curl -sS https://<frontend-url>/health
curl -sS https://<frontend-url>/api/health
```

Expected outcomes:
- Backend returns JSON health payload.
- Frontend `/health` returns `{"status":"ok"}`.
- Frontend `/api/health` returns backend health payload through proxy.

### A4. Custom Domain on AWS (Optional but Recommended)
1. In App Runner, add custom domain for frontend service.
2. Create required DNS records in Route53 (or external DNS provider).
3. Wait for validation and certificate issuance (managed by AWS/App Runner flow).
4. Re-test using custom domain URLs.

### A5. AWS Operational Checklist
- CloudWatch logs enabled and accessible for both services.
- Alarms configured for 5xx count and high response latency.
- Deployment strategy documented (auto deploy on push vs manual promote).
- Secrets rotation plan for `JWT_SECRET`.

---

## Section B: Deploy New Environment to Render

Recommended Render topology:
- Web Service 1: backend (Node)
- Web Service 2: frontend (Node service that serves dist + proxies `/api`)

### B1. Create Backend Service on Render
1. In Render dashboard: New -> Web Service.
2. Connect repository and pick branch.
3. Configure:
   - Name: `insurance-backend-<env>`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm ci --omit=dev`
   - Start Command: `npm start`
4. Environment variables:
   - `NODE_ENV=production`
   - `PORT=3001` (Render also sets `PORT`; keep app compatible)
   - `JWT_SECRET=<strong-secret>`
5. Deploy service.
6. Copy backend URL (example: `https://insurance-backend-staging.onrender.com`).

### B2. Create Frontend Service on Render
1. New -> Web Service.
2. Configure:
   - Name: `insurance-frontend-<env>`
   - Root Directory: `frontend`
   - Environment: `Node`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
3. Environment variables:
   - `NODE_ENV=production`
   - `PORT=8080`
   - `BACKEND_BASE_URL=<backend URL from B1>`
4. Deploy and wait for healthy status.

### B3. Render Post-Deployment Validation

```bash
curl -sS https://<render-backend-url>/api/health
curl -sS https://<render-frontend-url>/health
curl -sS https://<render-frontend-url>/api/health
```

Expected outcomes match AWS validation.

### B4. Render Custom Domain (Optional)
1. Add custom domain to frontend service in Render settings.
2. Add DNS records in domain provider per Render instructions.
3. Wait for SSL provisioning.
4. Validate HTTPS and API proxy path.

### B5. Render Operational Checklist
- Auto deploy behavior confirmed (on push to selected branch).
- Health checks monitored in Render events/logs.
- Environment variables stored in Render dashboard, not in code.

---

## Smoke Test Suite for Any New Environment

Run after every deploy:

```bash
curl -i https://<frontend-url>/
curl -i https://<frontend-url>/health
curl -i https://<frontend-url>/api/health
curl -i -X POST https://<frontend-url>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"userpass"}'
```

If login succeeds, use returned token for one protected endpoint:

```bash
curl -i https://<frontend-url>/api/customers/me \
  -H "Authorization: Bearer <token>"
```

---

## Rollback Strategy

### AWS App Runner
- Redeploy previous successful revision from App Runner deployment history.
- If config changed, re-apply last known good environment variables.

### Render
- Use manual rollback to a previous successful deploy.
- Re-check `BACKEND_BASE_URL` and `JWT_SECRET` after rollback.

---

## Known Project-Specific Notes
- This application intentionally contains vulnerable endpoints for security testing. Do not expose production-like data.
- Frontend proxy behavior depends on `BACKEND_BASE_URL` in `frontend/server.js`.
- Backend CORS list is permissive for testing by design (`backend/server.js`).

---

## Deployment Handover Template
Use this in release notes:

- Environment: `<env>`
- Platform: `AWS App Runner` or `Render`
- Frontend URL: `<url>`
- Backend URL: `<url>`
- Commit SHA: `<sha>`
- Deployment time (UTC): `<timestamp>`
- Smoke tests: `PASS/FAIL`
- Notes: `<issues / follow-ups>`