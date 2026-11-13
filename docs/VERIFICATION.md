# Delivery verification — 10 November 2026

Runtime used: Linux, Node.js v24.22.1, npm 11.9.0. Commands ran against the portable source and a fresh installation of its own declared dependencies, not the hosted Sites runtime.

| Check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed; 32 packages installed from the supplied lockfile |
| `npm run typecheck` | Passed; `next typegen` also verified from a source copy with no pre-existing `.next` output |
| `npm test` | 14 tests passed, zero failures |
| `npm run build` | Passed; optimized Next.js build with homepage, connection API, health API and access proxy |
| `npm run test:http` | Passed against the built production Node server and controlled loopback fixtures |
| Desktop browser review | Overview retained original white/blue layout; separate connection cards, native launch addresses, offline/disabled states and FinAgent configuration selection observed |
| Native Nawa/SupplyPilot apps | Source inspected only; not started or changed |
| Native FinAgent app | Source absent from the attached files; connector is configurable and disabled by default |
| Windows / PowerShell helpers | Included; not executed on Windows in this environment |
| Docker / authenticated online gateway | Configuration included; not deployed or validated here |

## Automated coverage

The 14 tests cover default project boundaries, disabled FinAgent, safe administrator-configured URLs, invalid configuration without a network call, GET-only probe options, credential isolation, JSON contract matching, HTML and oversized response rejection, native authentication errors, blocked redirects, dependency failures, launch-only mode, timeouts, offline errors, runtime configuration changes, real loopback HTTP responses, local hostname restrictions and gateway-key enforcement.

The additional production HTTP smoke script starts test-only HTTP services and the built Next.js server in one test process. It verifies the production homepage, health API, runtime connection API, healthy/auth-required/launch-only states, changed service health, 503 and redirect handling, no browser cookie/token forwarding, non-GET rejection and denial of an untrusted Host header. These fixtures are not the user's Nawa, SupplyPilot or FinAgent services.

Desktop UI checks observed the original overview and the new Project Connections page with the actual services absent. A later preview reload was blocked by the browser's URL policy, so final narrow-screen browser checks were not completed in this run. Responsive CSS is included. Automated production HTTP tests completed independently.

## Validate on your PC

1. Follow README.md and run `npm ci`, `npm run check`, `npm run build`, then `npm run test:http`.
2. Start the real Nawa and SupplyPilot services using their existing environments. Set their actual web/API URLs.
3. Configure FinAgent only after confirming its native URL and health contract.
4. Run `npm run connections:check`, then recheck within the dashboard.
5. Open each native application and verify its own sign-in, tenant, permissions and workflows.

Health verification is not acceptance of end-to-end business integration or enterprise production readiness. Future roadmap modules are plans until their corresponding code, deployment and evidence exist.

## Health-route and dependency maintenance update

Next.js and `@next/env` updated from 16.3.4 to 16.4.6. The lockfile now resolves `sharp` 0.35.5, `source-map-js` 1.2.2 and `baseline-browser-mapping` 2.11.35. The updated dependency audit reported zero known vulnerabilities. Type checking, all 14 automated tests, the production build and the production HTTP smoke check were rerun. The smoke check now verifies `/health` returns HTTP 200 and `status: ok`, alongside the existing `/api/health` route.
