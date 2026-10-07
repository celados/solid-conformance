---
type: Issue
id: "017"
status: confirmed
versions: [upstream-next-53ef0e69-development, upstream-next-53ef0e69-observe]
area: SSR/diagnostics
upstream:
  - https://github.com/solidjs/solid/issues/3723
found_by: docs
---

# Initial render failure is absent from the structured diagnostics channel

A synchronous throw on the first `renderToStream` pass should produce `SSR_RENDER_ERROR_CONTAINED` with `handling: "failed"`, alongside the public error hook. The hook receives the original error once and the caller receives the same throw, but the diagnostic capture contains zero records.

```sh
bun test ./findings/017-initial-render-error-record/repro.test.ts
```

`BUILD_MODE=observe` reproduces the same failure. Production has no diagnostics channel by design, so this finding concerns only development and observe artifacts. The rc.13 comparison runs in the isolated baseline checkout and is recorded in the wave receipt.

RFC 08 (`documentation/solid-2.0/08-dev-diagnostics.md`, `SSR_RENDER_ERROR_CONTAINED`) describes this as the structured face of the same errors delivered to `renderToStream`'s `onError`, including a request failed outside every boundary. RFC 12 explicitly includes synchronous first-pass throws in the hook's `failed` road. The hook already works; omitting this diagnostic prevents a monitor subscribed to the documented channel from observing an otherwise ordinary failed render. The runtime is the likely wrong side.

## Shrinking

One render callback throws a single Error. There are no components, boundaries, async sources, request scope, network, browser, stores, or actions. The hook count is an independent positive control; removing the diagnostics assertion makes the test green. Server bundling selects public exports from exactly one installed package graph.

## Dedupe

Searched all states in solid, solid-router, and solid-start for `SSR_RENDER_ERROR_CONTAINED`, `diagnostic synchronous render`, and `renderToStream first pass`. Reviewed the relevant solid issues #3478, #3750, #3468, #3569, and #3723: they cover stream completion, boundary discovery, sanitization, and the request-level hook. #3723 added request failures before any render, whereas this render's hook already reports its original error and only its diagnostics record is absent. No matching issue was found.
