---
type: Issue
id: "024"
status: confirmed
versions: [upstream-next-53ef0e69-development, upstream-next-53ef0e69-production]
area: docs/server-functions/arguments
upstream: []
found_by: docs
---

# A lone typed array does not require the documented rich-arguments opt-in

RFC 10 lists typed arrays among arguments rejected by default until `enableRichArguments()` is installed. A nested Uint8Array is rejected with that guidance, but the same array as the sole argument is transported successfully and retains its type and bytes.

```sh
bun test ./findings/024-single-typed-array-encoding/repro.test.ts
```

`BUILD_MODE=production` fails the same documentation oracle. The client does not import or invoke the rich-arguments entry. The nested refusal and the successful `[65]` round trip are independent positive controls preceding the disputed rejection assertion.

`documentation/solid-2.0/10-server-functions.md:47` explicitly lists typed arrays with Dates, Maps, Sets, cycles and top-level undefined as rich-only arguments. The runtime recognizes a lone ArrayBufferView as a native HTTP body, like Blob and File. The docs are likely wrong: document that exception while retaining the rich-arguments requirement for a typed array nested in an argument graph.

## Shrinking

One server reference returns its argument; the browser calls it with one nested array and one lone array. There are no components, reactivity, frames, router, hydration, stores, async sources or user events. A loopback HTTP endpoint and system Chrome exercise the actual default argument encoder. The server's request provider is the normal AsyncLocalStorage context required by the public handler.

## Dedupe

Searched open and closed issues in solidjs/solid, solidjs/solid-router and solidjs/solid-start for `"typed array" "arguments"`; only solid #3235 matched. It concerns guarding failure channels inside Error carriers and non-enumerable result slots, not the default encoding of a lone argument. A further solid all-state `Uint8Array rich arguments` search matched nothing. No local finding covers this input-shape exception.
