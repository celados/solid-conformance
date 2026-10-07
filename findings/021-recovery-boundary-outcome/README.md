---
type: Issue
id: "021"
status: confirmed
versions: [upstream-next-53ef0e69-development, upstream-next-53ef0e69-observe]
area: docs/SSR/recovery
upstream: []
found_by: docs
---

# Recovery documentation names the wrong server boundary outcome

RFC 08 says a recovery record joins a server boundary with outcome `client`. A streamed async rejection produces fresh client DOM and one recovery record joined by the same hydration id, but the corresponding server boundary outcome is `error`.

```sh
BUILD_MODE=observe bun test ./findings/021-recovery-boundary-outcome/repro.test.ts
```

Development fails the same final assertion. Production explicitly skips this records-only contract; the ordinary recovery property still runs against production in `tracks/frames/recovery.test.ts`. rc.13 is a separate isolated comparison.

`documentation/solid-2.0/08-dev-diagnostics.md:887` describes the recovery record as the other end of a boundary whose outcome was `client`; line 896 repeats the enum when describing the join. The same chapter's boundary definition at line 817 instead correctly reserves `client` for `ssrSource: "client"` and names a thrown error `error`. The docs are likely the wrong side: recovery and containment describe the client-side remedy, whereas the server outcome names why rendering ended.

## Shrinking

One Loading boundary reads a promise that rejects only on the server after its shell ships. The browser runs the same tree, resolves its read, and commits the recovered text. The test first proves one server boundary and a recovery with exactly its id, then checks only the disputed enum. The HTML document, hydration bootstrap and system Chrome remain because a server-only rejection does not prove an actual client recovery. There are no router, RPC, frames, actions, stores, nested boundaries or transport disconnects.

## Dedupe

All-state searches in solidjs/solid, solidjs/solid-router and solidjs/solid-start used `recovery boundary outcome` and `"recovery" "records"`. The first matched nothing; broad solid hits #3136, #2997, #2883, #2761 and #3238 concern version-skew responses, missing error fallback, bundle size, throwing effects and invocation authorization. Reviewed #2997 specifically: it loses the fallback before shell flush, whereas this repro recovers correctly and disputes only a documented record enum. No matching local finding exists.
