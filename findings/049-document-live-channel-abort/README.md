---
type: finding
id: '049'
status: confirmed
versions:
  - 'upstream next 53ef0e69: development, observe, production'
area: SSR/server-components/teardown
upstream:
  - https://github.com/solidjs/solid/issues/3768
found_by: docs
---

# Aborted document closes its live-hole channel twice

A document containing one server component with an async iterable should stop cleanly when its render signal aborts; completing the test-owned producer afterward should also be harmless. Instead, all three HEAD builds emit an uncaught `TypeError: Invalid state: Controller is already closed` from the document live channel's `end()` → `channel.close()`.

Run `bun test ./findings/049-document-live-channel-abort/repro.test.ts`.

The test first runs the identical component and source to normal completion, asserting the initial value is rendered and the generator closes exactly once. Its second run aborts the public `renderToStream` lifecycle, then releases the producer; Bun records the uncaught exception and the command fails. This violates the teardown/no-unhandled-error invariant; the runtime is the side to fix.

The repro contains one server component, one memo, one iterable yielding one value, one pending gate and one abort. It uses the public `frameTransformDirectResult` helper to supply the document server-component face. No router, HTTP server, browser, slots, reconnect, streaming `Loading`, second yield, or five-second timer is needed. The pending gate is released for test-owned cleanup; the normally completed control passes before the failing lifecycle.

Open and closed issues in solidjs/solid, solidjs/solid-router and solidjs/solid-start were searched for `"Controller is already closed"`, `SSR abort stream close`, and `"live hole" abort`. Solid #3768 concerns a response-body cancel/pre-flush redirect that fails to stop rendering; this repro uses the existing signal abort and stops its generator, but the document live-hole channel subsequently closes twice. #035 in this suite is a client decoder pull left pending after body death, a different failure. The rc.13 comparison remains to be run independently.
