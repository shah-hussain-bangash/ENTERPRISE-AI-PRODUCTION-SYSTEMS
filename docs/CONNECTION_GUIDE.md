# Connect the three projects locally

Keep the dashboard, Nawa, SupplyPilot and FinAgent in **four separate folders**. Do not merge their virtual environments, `node_modules`, databases, `.env` files or identity sessions. This package does not change their source or install them.

## Terminal 1 — dashboard

From this dashboard root in Cursor:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. If you already have `.env.local`, preserve and edit it. Settings are server-side runtime variables. Restart after changes.

## Terminal 2 — Nawa

The inspected archive was `UAE-Sovereign-Agentic-AI(2).rar`, with the current source in `UAE-Sovereign-Agentic-AI/nawa-workspace`. Open the folder containing `nawa.py`. Use its existing setup guide and Python 3.12 environment.

After Nawa is set up:

```powershell
py -3.12 nawa.py run --api-port 8000 --web-port 5173
```

If either port is occupied, its supported alternative is:

```powershell
py -3.12 nawa.py run --auto-ports
```

Read the printed **API port** and **READY web URL**, then copy the actual addresses into the dashboard's `NAWA_API_URL` and `NAWA_WEB_URL`.

Verified in source:

- Native web development default: port 5173; API default: port 8000.
- `GET /health/ready`: JSON `{ "status": "ready" }`; database readiness is checked.
- `GET /health/live`: JSON `{ "status": "ok", "version": "..." }`; liveness is different from readiness.
- Authentication uses `nawa_session` with native demo/OIDC routes and CSRF controls.
- Nawa sets `X-Frame-Options: DENY`. This dashboard opens it in a new tab; it does not embed or weaken that protection.

For the native Docker setup, the web proxy is normally `http://127.0.0.1:8080`; `/health/ready` is forwarded to its API. The dashboard API base can point to that proxy if the internal API is not published. Confirm the route responds before configuring it.

## Terminal 3 — SupplyPilot

The inspected archive was `supplypilot-ai-dev(2).rar`. Open its `supplypilot-ai-dev` root, follow its README for initial migration, seed and frontend build, and activate its existing Python environment. Preserve its existing installation-specific token secret and demo password.

From the **SupplyPilot backend folder**, with its environment activated and its required environment variables loaded:

```powershell
python -m uvicorn supplypilot.main:app --host 127.0.0.1 --port 8001
```

This replaces the original start command on port 8000. If you run the original start script at the same time, it may compete with Nawa. Use one server process per project.

Both SupplyPilot UI and API are served at `http://127.0.0.1:8001` after its frontend has been built. Its optional separate Vite development server is not needed for the combined deployment.

Verified in source:

- `GET /health`: JSON `status: ok`; checks the configured database.
- `POST /api/v1/auth/login`: native login with username/password, returning a short-lived bearer token.
- `GET /api/v1/me` and collection endpoints require native authorization.
- Procurement writes, approvals and ERP effects remain in SupplyPilot. This dashboard calls none of them.

For its existing Docker Compose configuration, change the **host-side** port mapping from `127.0.0.1:8000:8000` to `127.0.0.1:8001:8000` in your own copy, then validate that setup. This project does not modify the uploaded archive.

## Terminal 4 — FinAgent

FinAgent source was not among the two archives attached to this request. Run your existing FinAgent project using its own instructions. Choose a free port (8002 is a possible assignment only if your installation supports it).

In this dashboard's `.env.local`, enable launch-only mode with your actual URL:

```dotenv
FINAGENT_ENABLED=true
FINAGENT_WEB_URL=http://127.0.0.1:8002
FINAGENT_API_URL=
FINAGENT_HEALTH_PATH=
FINAGENT_HEALTH_KEY=status
FINAGENT_HEALTH_VALUE=
```

Replace the web URL with the one your server prints. The card will show **Launch only**. When you inspect the source or OpenAPI schema, set the actual API base, health path, JSON key and expected value. For example, use `HEALTH_VALUE=ok` only if that exact string is returned by the real health route. A 200 HTML homepage is not a health contract.

If FinAgent has no health route, implement a small, read-only readiness endpoint in its own backend using that project's conventions. Confirm database/dependency readiness and avoid returning secrets or case data. The dashboard does not guess the route or mutate FinAgent code.

## Finish in the dashboard

1. Save `.env.local` in the dashboard root.
2. Restart the dashboard terminal.
3. Open **Project connections**.
4. Click **Recheck connections**.
5. Click **Open Nawa**, **Open SupplyPilot** or **Open FinAgent** and sign in within that application.

No CORS change is needed for the supplied checks: the dashboard server calls each health API and the browser talks only to `/api/connections` on the dashboard origin. Native applications are opened normally. Direct browser calls to application business APIs would be a different integration stage.

## Connection state meanings

| State | Meaning / action |
| --- | --- |
| Health verified | Configured JSON health field matched. Check business authorization separately. |
| API offline | Server could not reach the configured API. Confirm process, address and port. |
| Timed out | Endpoint exceeded the configured timeout. Inspect the native service. |
| Sign-in required | Health route returned 401/403. Use native login; configure an appropriate probe. |
| Redirect blocked | Configure the final direct health route. Redirects are not followed. |
| Invalid health response | Response was non-JSON, malformed or larger than 32 KiB. |
| Health mismatch | JSON exists, but its configured field did not equal the expected healthy value. |
| HTTP error | Health route returned another unsuccessful HTTP status. |
| Launch only | Native web URL exists; health contract is not configured. |
| Not enabled / setup required | Configure the project and set its ENABLED variable to `true`. |

Each probe is a GET with `Accept: application/json`, no cookies or Authorization header, no redirect following, and a default three-second timeout. Only the three environment-configured projects are probed. There is no arbitrary target URL API.
