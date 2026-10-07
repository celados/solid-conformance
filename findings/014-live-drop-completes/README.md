---
type: Issue
id: "014"
status: confirmed
versions: [upstream-next-53ef0e69]
area: server-functions/live/transport
upstream:
  - https://github.com/solidjs/solid/issues/3819
found_by: docs
---

# A connected live source completes after a dropped TCP connection

A standing `live(GET(fn))` source should reconnect after its response connection dies with an unfinished generator. Terminating a real TCP proxy socket after its first value makes `onstatus` report `connected, closed` instead of `reconnecting`, and the source never reconnects.

```sh
bun test ./findings/014-live-drop-completes/repro.test.ts
```

The test leaves the origin HTTP server running, terminates the downstream socket of a bare TCP proxy, and permits subsequent reconnects through that same proxy. Before the drop it checks that the generator is still open and the last status is `connected`, then asserts the documented reconnect status. The producer waits on a test-owned deferred rather than its request signal, so abort cannot finish it normally before the wire dies. The red assertion is `Expected to contain "reconnecting", Received ["connected", "closed"]` in both development and production on HEAD `53ef0e69`.

`documentation/solid-2.0/10-server-functions.md`, under `live(fn)`, says post-connect deaths re-invoke with exponential backoff, and distinguishes a death with deferreds still open from successful completion. This is a runtime discrepancy: no hydration, frames, reactive owner, cache, or body interception participates in this repro.

## Shrinking

Removed Loading, createMemo, frames installation, custom fetch, prepareRequest, intermediary response streams, slow first message, and all nested values. The server function is one async generator yielding a scalar and then waiting for an externally released promise. The TCP proxy is essential to distinguish a transport death from a host that completes the response when shutting down its listener. The client only iterates `live(GET(reference))` and records values/status. Ending the iteration as a consumer instead of dropping the wire closes normally, as expected; the disconnect is the essential failing transition.

## Dedupe

Searched open and closed issues in solid, solid-router, and solid-start for `live reconnect`, `live connection`, and `live completed`. The related open #3819 is about per-scope hydration takeover of a server value which is still streaming; this program is CSR and starts a fresh HTTP subscription. No matching established issue was found. The rc.13 result is recorded in the wave receipt after running the isolated comparison checkout.
