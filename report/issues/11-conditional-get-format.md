---
type: Issue
title: "304 format header overwrites cached GET representation"
status: draft
tier: A
severity: med
findings: ['036']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: read.ts
---

# 304 format header overwrites cached GET representation

Browser-managed conditional GET should replay cached {value:17}. Both client fetches see 200, but the second decoded result is undefined.

```ts
import { getRequestEvent, respond } from "@solidjs/web";
export const calls: (string | null)[] = [];

export function read() {
  const headers = {
    etag: '"constant"',
    "cache-control": "private, max-age=0, must-revalidate",
  };
  const conditional = getRequestEvent()!.request.headers.get("if-none-match");
  calls.push(conditional);
  // Call this GET twice in Chrome. Chrome adds If-None-Match itself.
  // The second decoded value is undefined, despite cached { value: 17 }.
  return conditional === '"constant"'
    ? new Response(null, { status: 304, headers })
    : respond({ value: 17 }, { headers });
}
```

Register `read` as a GET server function named `conditional`. From a Chrome page, call `GET(createServerReference("conditional"))()` twice. Chrome sends If-None-Match on the second request; application code sets no conditional header.

**Expected:** Both decoded results are `{ value: 17 }`.
**Actual:** The second result is undefined, although Chrome replays the cached body as status 200.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`. Development and production fail on HEAD and rc.13; HEAD also fails with observe (production runtime plus optional instrumentation).

Development additionally warns that a scripted call returned 304, despite the browser-generated conditional request.

Related: [#3101](https://github.com/solidjs/solid/issues/3101), [#3134](https://github.com/solidjs/solid/issues/3134)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone folder](../repros/11-conditional-get-format/) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](../repros/11-conditional-get-format/build.ts)
- [client.ts](../repros/11-conditional-get-format/client.ts)
- [link-head.ts](../repros/11-conditional-get-format/link-head.ts)
- [read.ts](../repros/11-conditional-get-format/read.ts)
- [repro.test.ts](../repros/11-conditional-get-format/repro.test.ts)
- [server.ts](../repros/11-conditional-get-format/server.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
