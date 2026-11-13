# Zenith Enterprise AI Workspace

Zenith is a local Next.js portal for exploring and launching Nawa, FinAgent, SupplyPilot and IndustrialAI Sentinel. The repository contains the portal UI, project connection checks, sample workflows and planned platform capabilities. The four business applications are separate projects.

## Run locally

Use Node.js 22.12 or later and npm. In a terminal opened in this folder:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Keep the terminal open. Configure owner login with `node scripts/configure-login.mjs`, then restart the portal. See `docs/SIGN_IN.md` and `docs/CONNECTION_GUIDE.md` for further setup; project ports and descriptions in older documentation should be checked against your own configuration.

Each connected project runs separately. Update `.env.local` with its actual local web and health URLs. An API health check verifies only that the configured endpoint responded; it does not verify permissions, model quality or an end-to-end workflow.

## Verification

```powershell
npm run check
node --test tests/portal-oidc.test.mjs
npm run build
```

## Shared sign-in

An optional Keycloak OpenID Connect integration is included as a local development experiment and is disabled by default. It requires separate confidential-client credentials, an explicitly authorized user subject, an HTTPS deployment for non-local use, and compatible application integration. IndustrialAI's source and data are not included in this repository. Shared logout, deployment security and a production identity review remain required before production use.

## Safety and scope

Keep `.env.local`, passwords, client secrets, runtime databases, uploaded documents and generated files out of source control. The dashboard contains clearly identified sample and planned capabilities; it is not evidence that those services are deployed in production.
