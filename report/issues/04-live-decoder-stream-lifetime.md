---
type: "Issue"
title: "[2.0 rc.13 + next] Open decoded iterators are missed when a response dies"
status: "filed"
tier: "A"
severity: "high"
findings: ["014","035"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "pull.ts"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
filed: "https://github.com/solidjs/solid/issues/3890"
---

### Describe the bug

A dropped live response should reconnect; a non-live iterator pull should reject. Instead live closes normally and a decoded pull stays pending.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```ts
export async function pullAfterTransportDeath(iterator: AsyncIterator<unknown>, cut: () => void) {
  const next = iterator.next().then(
    (value) => ({ outcome: "resolved", value }),
    (error) => ({ outcome: "rejected", message: error.message }),
  );
  // Close or error the response body while next() is pending.
  cut();
  // Both paths leave this pull pending instead of rejecting it.
  return Promise.race([
    next,
    new Promise((resolve) => setTimeout(() => resolve({ outcome: "pending" }), 300)),
  ]);
}
```

2. Use the decoded iterator from a server function that yields "first", then waits. Consume the first value and pass the iterator plus a response-body close/error callback to this function. For the live variant, drop the TCP socket after its first message while the origin remains available.

### Expected behavior

**Expected:** The pending pull rejects; a live subscription reconnects after a TCP drop.
**Actual:** The pull remains pending, and live reports closed instead of reconnecting.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: Development and production fail on HEAD and rc.13. The decoder case also fails with the observe export (production runtime plus optional instrumentation).

### Additional context

An unfinished source must not be classified as completed when the transport dies. This breaks live reconnect and pending consumer cleanup.

Suspected shared cause: the decoder counts unfinished streams using `__SEROVAL_STREAM__`, which Seroval 1.6.8 JSON Stream objects lack. Both abort cleanup and live completion use that classification; this grouping is a hypothesis, not a patch-confirmed diagnosis.

Related: [#3819](https://github.com/solidjs/solid/issues/3819), [#3125](https://github.com/solidjs/solid/issues/3125), [#3244](https://github.com/solidjs/solid/issues/3244), [#3232](https://github.com/solidjs/solid/issues/3232)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/README.md).

Copy [the standalone folder](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/build.ts)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/link-head.ts)
- [live-client.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/live-client.ts)
- [live-server.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/live-server.ts)
- [live.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/live.test.ts)
- [pull.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/pull.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/repro.test.ts)
- [server.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/04-live-decoder-stream-lifetime/server.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts ./live.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
