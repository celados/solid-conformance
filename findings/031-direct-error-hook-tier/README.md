---
id: '031'
status: confirmed
versions: ["HEAD 53ef0e69 development", "HEAD 53ef0e69 production"]
area: SSR/server-functions/docs
upstream: []
found_by: docs
---

# Direct invocation error hook tier

RFC12 L171 says ambient is the only tier that sees direct in-process calls. A direct server function inside a render with its own `onError` reaches that local hook once and the ambient hook zero times; the local mapping is rendered.

Run: `bun test ./findings/031-direct-error-hook-tier/repro.test.ts`.
Production: `BUILD_MODE=production bun test ./findings/031-direct-error-hook-tier/repro.test.ts`.

The documentation appears stale: current `reportDirectFailure` deliberately receives the request render's `requestErrorHook`. The same paragraph correctly says per-request hooks override ambient policy. Both runtime behavior and this latter rule favor the local hook.

The request scope is essential. Five positive assertions prove a real invocation of `direct-hook`, its original error identity, `kind: server-function`, `direct: true`, and the local fallback before the ambient-only oracle fails. No HTTP endpoint, browser, async source, or transport is involved.

Open and closed issue searches in solidjs/solid, solid-router and solid-start for `configureServerErrors direct` returned only solid#3468. That issue concerns production error sanitization; its linked implementation PR #3481 introduces the hook and repeats the old ambient-only wording, but neither reports the current direct-hook tier contradiction. They are historical context rather than a matching reported discrepancy. rc.13 comparison remains pending.
