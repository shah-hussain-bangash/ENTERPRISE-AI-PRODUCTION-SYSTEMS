# Platform Studio UI update

This is a UI-first extension to the existing Zenith Enterprise AI Workspace. Nawa, FinAgent and SupplyPilot keep their native services, sign-in, authorization and health-check adapters.

## Install into your existing Windows workspace

Extract the download into a separate folder. Stop only the portal development process with Ctrl+C before applying. In the extracted `zenith-enterprise-ai-workspace` folder run:

```powershell
.\Apply-UI-Update.ps1 -TargetPath 'C:\zenith-enterprise-ai-workspace'
```

Follow your organization's PowerShell execution policy; do not weaken it to run the installer. Manual alternative: copy the eleven files listed in Apply-UI-Update.ps1 into the matching folders after backing them up.

The installer backs up every existing changed file in a timestamped ui-backups folder before copying. It does not copy .env.example or .env.local, change API routes, change the security proxy, install packages, restart services or replace package.json/package-lock.json. Existing connection settings and dependencies remain in place. Any personal edits to the listed UI files are replaced by the supplied UI version and retained in the backup.

In your portal terminal:

```powershell
Set-Location 'C:\zenith-enterprise-ai-workspace'
npm run check
node --test tests/platform-studio.test.mjs
npm run dev
```

If the portal is already running, refresh it; do not start a duplicate server. Open http://127.0.0.1:3000/#platform-studio. Keep native project services running.

## Screens

- `#platform-studio`: module catalogue, search, priority filter, real connection summaries and roadmap JSON export.
- `#platform-identity`: sample policy matrix with same-tenant, cross-tenant, read, propose and independent-review scenarios.
- `#platform-evaluation`: candidate comparison, adjustable quality threshold, critical failure gate and synthetic report export.
- `#platform-execution`: sample checkpoint progression, approval, uncertain timeout, locked dispatch, reconciliation and cancellation.
- `#platform-operations`: fixed synthetic traces, application filter, span timings and illustrative costs. Live availability remains in Project connections.
- `#platform-connectors`: browser-local connector drafts, scope selection and a sample create/update/delete synchronization cycle.
- `#platform-models`: primary/fallback routing examples, browser-local sample budget and budget-block scenarios.

Each module also has Implementation gates and Integration contract tabs. Checklist selections are planning notes, not proof of implementation. Navigation remains accessible through the workspace search and sidebar.

## Implementation boundaries

The six new workbenches are interactive UI demonstrations. They do not implement SSO, enforce actual permissions, execute an agent, evaluate a model, synchronize external records or contact a model provider. Sample policy checks run only in the browser. Browser drafts are not shared, encrypted enterprise configuration or auditable server records. Never enter passwords, API keys, tokens or confidential data into planning fields.

The only actual service checks are the existing GET /api/connections probes. They do not forward browser credentials. Health results do not establish authorization, AI quality or cross-product workflow correctness. No production readiness score is inferred from the number of available services.

## Local data

Connector drafts, model budget and manual implementation-review marks are saved in browser localStorage when available. Storage failures are labeled as session-only. Workflow and evaluation simulations reset on navigation. Connector deletion removes only a browser draft. JSON exports clearly identify synthetic or manual planning content.

## Validation

`npm run check` retains the existing typecheck and connection-service tests. `node --test tests/platform-studio.test.mjs` tests the added sample policy denial, release gating, cancellation, budget and duplicate-dispatch behavior. `npm run build` builds the full application; `npm run test:http` checks the existing API/security boundary against controlled HTTP fixtures.

Backend implementation should follow the proposed order: identity/contracts, evaluation, durable execution, telemetry, source connectors and model gateway. Use the visible acceptance gates to define evidence for each integration.
