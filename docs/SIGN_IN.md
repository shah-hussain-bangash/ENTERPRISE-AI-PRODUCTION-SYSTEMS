# Zenith sign-in and portfolio entrance

The new entrance is `/sign-in`; `/` redirects there. The existing portal is at
`/workspace`, retaining its hash routes and all native project links. Product
images are original SVG illustrations of the three workspaces, not screenshots
or claims of production use. Planned foundations are explicitly marked Planned.

## Local installation

Extract the updated source ZIP into a separate folder. Run the bundled
`Apply-Signin-Update.py` using your existing SupplyPilot Python interpreter and
`--target C:\zenith-enterprise-ai-workspace`. It validates package identity and
the update checksums, backs up the specific files being replaced, then copies
only the sign-in update. It does not copy `.env.local`, install dependencies,
reseed databases or stop Nawa, SupplyPilot, FinAgent or Docker. Run it while
ONLY the portal's dev server is stopped. No unsigned PowerShell script is used.
`signin-backups/<timestamp>/backup-manifest.json` records originals. To roll
back, pass `--rollback <that backup directory>` to this same Python updater.

In the portal folder run:

```powershell
node .\scripts\configure-login.mjs
npm run dev
```

Enter your chosen owner email and a new portal-specific password at the private
terminal prompts. Use a password different from the native applications. This
script backs up `.env.local`, preserves existing connection settings, and writes
only PORTAL_ADMIN_EMAIL, PORTAL_PASSWORD_HASH and PORTAL_SESSION_SECRET. No
default credentials are shipped. The email is an account identifier: this
single-owner flow does not verify email ownership or send verification mail.

If no owner settings are present and WORKSPACE_ACCESS_MODE=local, the entrance
has an explicitly labelled Open local preview link. That local preview is not
an authenticated session. Setting any owner variable without completing the
other settings fails closed and disables access. Complete the setup script to
activate the form and require a session for the workspace and connections API.
Existing PowerShell calls to `/api/connections` will then return 401 unless they
include a valid portal session. `/health` and `/api/health` remain minimal health
probes behind the existing localhost/gateway boundary.

## Owner session behavior

- Server-side scrypt password verification and generic invalid-credential errors.
- HMAC-signed 8-hour HttpOnly, SameSite=Lax cookie; Secure on an HTTPS origin.
- Server-side authorization in workspace rendering and the connections endpoint,
  with an additional request boundary in proxy.ts. Secrets never enter props.
- Same-origin checks on login and logout; no GET logout or arbitrary redirect.
- POST logout clears this browser's session. Rotating PORTAL_SESSION_SECRET
  invalidates every session. Logout does not provide per-token revocation before
  expiry if a cookie has already been stolen.
- Eight login attempts per 15 minutes in a single server process. This is a
  bounded owner-demo throttle, not a distributed, identity-provider-grade limit.

This is an owner portfolio login, not a complete enterprise IAM platform. There
is no self-registration, password recovery email, MFA, tenant membership,
multi-user RBAC, session revocation registry or audit trail for authentication.
Native application authentication remains separate; portal login grants no
access to their APIs, case data, procurement authority or documents.

## AWS deployment work still required

Nothing was deployed to AWS in this update. Keep the current local ingress
restriction. Before external deployment, use the organization's IdP / Cognito
with MFA, access policy and distributed rate limits, configure HTTPS, protect
origin ingress, and store secrets in AWS Secrets Manager. Do not expose this
local preview by changing the Host boundary or publishing a localhost URL.

For an authenticated gateway, preserve WORKSPACE_ACCESS_MODE=gateway and the
existing trusted proxy-secret mechanism from DEPLOYMENT.md. The proxy must
authenticate the person and overwrite the gateway key; a gateway key alone is
not individual user authentication. The sign-in page shows a continue button in
gateway mode if owner settings are absent. It does not itself authenticate with
Cognito. Do not treat arbitrary x-amzn-oidc-identity headers as proof of identity.
For ALB/Cognito, verify the signed x-amzn-oidc-data token and the expected signer,
or use an approved gateway that does so before injecting the private gateway key.
This AWS integration remains a separate implementation and acceptance task.

When behind HTTPS proxying, set PORTAL_PUBLIC_ORIGIN to the exact browser-facing
origin (for example https://workspace.example.com), without a trailing slash.
This is used for same-origin request checks and Secure cookies. Configure the
public URL and private ingress together, and test that forged origins/headers
and direct unauthenticated requests fail. Native apps need deployed HTTPS
WEB_URLs and server-reachable API_URLs; cloud localhost is not your Windows PC.

References:
- https://nextjs.org/docs/app/guides/authentication
- https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-authenticate-users.html

## Validation

Run `node --test tests/*.test.mjs`, `npm run typecheck`, `npm run build`, then
`node tests/sign-in-http.mjs` and the existing `npm run test:http`. HTTP fixtures
use temporary in-memory services and synthetic credentials, never business APIs.
Windows installation must be verified on the user's PC.
