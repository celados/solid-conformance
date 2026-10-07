---
type: Issue
title: "Open decoded iterators are missed when a response dies"
status: draft
tier: A
severity: high
findings: ['014', '035']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: pull.ts
---

# Open decoded iterators are missed when a response dies

A dropped live response should reconnect; a non-live iterator pull should reject. Instead live closes normally and a decoded pull stays pending.

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

Use the decoded iterator from a server function that yields "first", then waits. Consume the first value and pass the iterator plus a response-body close/error callback to this function. For the live variant, drop the TCP socket after its first message while the origin remains available.

**Expected:** The pending pull rejects; a live subscription reconnects after a TCP drop.
**Actual:** The pull remains pending, and live reports closed instead of reconnecting.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`. Development and production fail on HEAD and rc.13. The decoder case also fails with the observe export (production runtime plus optional instrumentation).

Suspected shared cause: the decoder counts unfinished streams using `__SEROVAL_STREAM__`, which Seroval 1.6.8 JSON Stream objects lack. Both abort cleanup and live completion use that classification; this grouping is a hypothesis, not a patch-confirmed diagnosis.

Related: [#3819](https://github.com/solidjs/solid/issues/3819), [#3125](https://github.com/solidjs/solid/issues/3125), [#3244](https://github.com/solidjs/solid/issues/3244), [#3232](https://github.com/solidjs/solid/issues/3232)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone folder](../repros/04-live-decoder-stream-lifetime/) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](../repros/04-live-decoder-stream-lifetime/build.ts)
- [link-head.ts](../repros/04-live-decoder-stream-lifetime/link-head.ts)
- [live-client.ts](../repros/04-live-decoder-stream-lifetime/live-client.ts)
- [live-server.ts](../repros/04-live-decoder-stream-lifetime/live-server.ts)
- [live.test.ts](../repros/04-live-decoder-stream-lifetime/live.test.ts)
- [pull.ts](../repros/04-live-decoder-stream-lifetime/pull.ts)
- [repro.test.ts](../repros/04-live-decoder-stream-lifetime/repro.test.ts)
- [server.ts](../repros/04-live-decoder-stream-lifetime/server.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts ./live.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
