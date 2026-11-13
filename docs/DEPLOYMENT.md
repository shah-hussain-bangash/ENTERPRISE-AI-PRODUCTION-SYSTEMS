# Move from localhost to online services

## Build the Node application

```bash
npm ci
npm run check
npm run build
npm start
```

`npm start` binds to `127.0.0.1:3000`. Place an authenticated reverse proxy on the same host or use the optional container build behind an authenticated gateway. This package has no public anonymous mode. `WORKSPACE_ACCESS_MODE=local` accepts loopback Host names only. This is a personal local development boundary, not multi-user authentication.

## Addressing changes

| Setting | Used by | Online value |
| --- | --- | --- |
| `*_WEB_URL` | User's browser | Reachable HTTPS native web application URL |
| `*_API_URL` | Dashboard Node server | Reachable HTTPS API origin/base path |
| `*_HEALTH_PATH` | Dashboard Node server | Verified direct JSON readiness route |
| `*_HEALTH_KEY`, `*_HEALTH_VALUE` | Probe validation | Exact JSON field and healthy string |

Change these through runtime environment settings and restart. They are not `NEXT_PUBLIC_*` variables and are read at request time. No browser API key is required. The public connection response intentionally contains web/API addresses, state and a sanitized version only; do not place credentials or secret query strings in a URL.

`127.0.0.1` on an online server means **that server**, not your Windows laptop. Inside Docker it means **that container**. Do not deploy the dashboard with laptop-only API URLs and expect cloud access to those processes. For separate hosts, use reachable service DNS, network policy and trusted TLS. Native application browser URLs must be reachable from the user's browser independently of server networking.

## Authenticated gateway mode

1. Deploy the Node service on a private interface/network with no direct public path.
2. Configure a reverse proxy with real user authentication. An enterprise deployment should use the organization's IdP, MFA and membership policy.
3. Generate a unique random gateway secret of at least 32 characters. Store it in server/proxy secret configuration, never in client JavaScript or source control.
4. Set `WORKSPACE_ACCESS_MODE=gateway` and `WORKSPACE_GATEWAY_SECRET` on the dashboard server.
5. After authenticating the user, the proxy **overwrites** `X-Workspace-Gateway-Key` with that same secret before forwarding every dashboard request, including assets and APIs.
6. Block direct ingress to the dashboard service and verify both unauthenticated and invalid-key requests fail.

The shared gateway key authenticates the trusted proxy, **not an individual user**. The proxy must authenticate the actual person. This does not grant that person access to Nawa, FinAgent or SupplyPilot. Those products continue enforcing their own identity and permissions.

Example Caddy configuration for a small private demonstration (replace the domain and configure the two environment secrets in Caddy; do not commit them):

```caddyfile
workspace.example.com {
    basic_auth {
        owner {$WORKSPACE_OWNER_PASSWORD_HASH}
    }
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Workspace-Gateway-Key {$WORKSPACE_GATEWAY_SECRET}
    }
}
```

Use Caddy's official password-hashing command for the password hash. Replace basic authentication with the organization's approved gateway for multi-user use. This example was supplied as a configuration reference and was not deployed or penetration-tested in this task.

## Optional container build

```bash
docker build -t zenith-workspace .
docker run --rm --env-file .env.local -p 127.0.0.1:3000:3000 zenith-workspace
```

The supplied Dockerfile builds Next.js standalone output as a non-root runtime. This container path was not executed in the delivery environment. Supply reachable API URLs; laptop localhost URLs do not resolve to other containers. A remote gateway must inject its secret and enforce user authentication as described above.

## Online acceptance

- Protected ingress, HTTPS, intended user membership and a verified gateway header boundary.
- All three native applications retain their access controls; no shared admin-token shortcut.
- Explicit endpoint mapping, bounded health checks and redacted logs.
- Confirm the browser can open each `WEB_URL` and the Node server can reach each `API_URL`.
- Business API integration, tenant isolation, independent review and recovery tested separately from health checks.
- CI, immutable release, rollback, backups, restore rehearsal and measured operating limits.

The dashboard's Production Blueprint and Production Readiness pages describe the broader proposed system. Its 24 future modules are not deployed by this Node application.
