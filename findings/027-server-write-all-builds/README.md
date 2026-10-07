---
type: Issue
id: "027"
status: confirmed
versions: [upstream-next-53ef0e69-production]
area: docs/SSR/diagnostics
upstream: []
found_by: docs
---

# Server-write warnings are development-only despite the all-builds claim

RFC 11 says the release ships a setter deprecation warning in all server builds. A signal setter updates the server-rendered value in every tier, but its warning fires only in development and is absent in production.

```sh
BUILD_MODE=production bun test ./findings/027-server-write-all-builds/repro.test.ts
```

`BUILD_MODE=development` passes the identical positive control. The test captures all warning/error/info console faces, allows the diagnostics queue to drain, and verifies the write rendered `1` before asking whether the documented warning fired.

`documentation/solid-2.0/11-server-components.md:169` explicitly says `[SERVER_WRITE]` ships “in all server builds”. RFC 08's server checks definition instead limits developer guidance to development; the current runtime's `warnServerWrite` also explicitly returns outside that tier. The docs are likely wrong: update the older RFC 11 sentence to the intentional development-only policy.

## Shrinking

One plain signal and one setter execute in a synchronous string-render callback. There is no JSX, component nesting, browser, HTTP server, async source, action, store or optimistic primitive. An optional diagnostics capture activates the development observation channel; production has no channel. A fresh server bundle and process keep the warning's once-per-category state independent of other tests.

## Dedupe

All-state `SERVER_WRITE` searches in solidjs/solid, solidjs/solid-router and solidjs/solid-start matched only solid #3064. Its server store replacement is ignored, whereas this signal write succeeds and only the warning tier contradicts the docs; the issue is the historical motivation linked in this same RFC paragraph. No local finding duplicates the production warning contract.
