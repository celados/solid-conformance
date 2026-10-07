---
id: '035'
status: confirmed
versions: ["HEAD 53ef0e69 with seroval 1.6.8: development", "HEAD 53ef0e69 with seroval 1.6.8: observe", "HEAD 53ef0e69 with seroval 1.6.8: production", "rc.13 development", "rc.13 production"]
area: server-functions/serialization/async
upstream: []
found_by: docs
---

# Dying response leaves an iterator pull pending

RFC10 L229:3 says the decoder's end-of-body sweep rejects every deferred a dying body leaves open. A real server-function response yields `first`, but its pending next pull remains unresolved after a body error instead of rejecting.

Run: `bun test ./findings/035-decoder-iterator-body-death/repro.test.ts`.
The same command with `BUILD_MODE=observe` or `BUILD_MODE=production` also fails.

The implementation appears wrong. `createJSONDeserializer.abort` classifies a stream by `__SEROVAL_STREAM__`; the installed Seroval 1.6.8 `Stream` class has private state and no such property, so the sweep misses it. Plain deferred promises still reject. HEAD declares `seroval: ~1.6.7`, so this is an allowed dependency resolution, not a forced incompatible install.

The repro uses public `registerServerReference`, `handleServerFunctionRequest` and `decodeResponse`. A test-owned `ReadableStream.error()` cuts the handler's real response. A separate tee consumer proves the exact body failure arrived; the first decoded iterator value proves successful codec delivery before death. Only then does a 300ms bounded pending-pull oracle fail. No UI, nested promise, router, reconnect, or live declaration is required. The original nested-object shape has the same failure; shrinking removed that object and its promise.

Open and closed searches across solidjs/solid, solid-router and solid-start covered stream/abort/iterator, end-of-body, decoder/stream/end and `__SEROVAL_STREAM__`. Reviewed solid#3125 (server producer demand/teardown), #3244 (client response buffering and normal teardown), #3232 (unowned decoded promises), #3734 (SSR discovery non-convergence) and #3762 (TSRX semicolon parsing); none reports this decoder iterator classification failure. solid-start#2295 concerns missing Content-Type, not pending pulls. rc.13 comparison remains pending.

rc.13 开发／生产独立对照仍红，原始结果：evidence/solid-wave3-033035-rc13.log、solid-wave3-036038-rc13.log、solid-wave3-034044-rc13-prod.log。
