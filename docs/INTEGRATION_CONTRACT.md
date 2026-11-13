# From native launch to authenticated business integration

## Delivered boundary

The dashboard is a Node.js Next.js server plus React UI. It launches three independent web applications and probes configured health routes through `/api/connections`. The supplied sample workspaces remain synthetic and browser-local. Existing domain records are not loaded, copied or modified by this package.

The two attached archives were inspected as source only. Their backends, databases, authentication systems and native business flows were not started or changed. FinAgent endpoints and authentication still require source inspection.

## Why sessions remain separate

Nawa verifies its own session cookie, CSRF token, tenant, role and OIDC membership. SupplyPilot verifies its bearer token, tenant and explicit role. A dashboard role selector is presentation-only and grants no backend authority. Forwarding a single admin credential to all projects would not preserve these contracts.

To introduce shared sign-in later, provision users in a common identity provider, give each application its own client/audience, and validate issuer, audience, subject, membership and resource/action permission within each domain backend. Design token exchange or a BFF session for each application's actual authentication model. Do not pass Nawa's browser cookie to another product or reuse a token for a different audience.

## First connected workflow to implement

1. An authenticated buyer selects permitted, versioned Nawa quotation evidence.
2. A Nawa adapter exports an explicit evidence package after fresh authorization.
3. A SupplyPilot adapter validates the package against its own source/document model, schema and provenance rules.
4. SupplyPilot computes a proposal with deterministic constraints and its existing optimizer.
5. A separate authorized reviewer approves the exact proposal/evidence revision.
6. SupplyPilot records a durable execution intent, dispatches through its own ERP connector, and reconciles unknown outcomes before retrying.
7. A shared correlation ID connects redacted traces; each domain retains its own audit records.

FinAgent should first join through a separate read-only case workflow. Do not mix financial case evidence into procurement context without explicit policy and resource authorization.

## Adapter interface to agree before coding

| Contract | Required information |
| --- | --- |
| Identity context | Verified subject, tenant/membership, permitted action and token audience |
| Evidence reference | Owning product, immutable source ID/version, content hash and classification |
| Request | Schema version, correlation ID, request purpose and bounded input |
| Result | Typed status, result ID/version, authorized citations and owner service |
| Error | Stable code, retryability and safe correlation ID; no sensitive payload dump |
| Mutation | Exact approved version, idempotency key and current authorization |
| Recovery | Query/reconcile uncertain outcomes before a repeat external effect |

The table is a proposed adapter contract, not an existing endpoint map. Inspect both current schemas before choosing paths or payloads.

## Acceptance before calling the workflow integrated

- Deployed endpoint contracts and schema versions match implementation.
- Cross-tenant, revoked-user and unauthorized-resource cases fail on the server.
- Evidence revision changes invalidate stale approval.
- Retried requests and uncertain external writes do not create duplicate effects in the tested scenario.
- Model output is evaluated on a held-out set; critical authorization and injection regressions block promotion.
- Operators can diagnose a failed journey and demonstrate backup restoration and rollback.
- Secrets stay server-side; traces exclude sensitive documents, tokens and case details.

Use the dashboard's Enterprise AgentOps, TrustCenter, EvalLab and IntegrationHub plans to implement this stage. Their UI descriptions do not imply delivered infrastructure.
