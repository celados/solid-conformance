---
type: "Issue"
title: "[2.0 rc.13 + next] 304 format header overwrites cached GET representation"
status: "draft"
tier: "A"
severity: "med"
findings: ["036"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "read.ts"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

Browser-managed conditional GET should replay cached {value:17}. Both client fetches see 200, but the second decoded result is undefined.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

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

2. Register `read` as a GET server function named `conditional`. From a Chrome page, call `GET(createServerReference("conditional"))()` twice. Chrome sends If-None-Match on the second request; application code sets no conditional header.

### Expected behavior

**Expected:** Both decoded results are `{ value: 17 }`.
**Actual:** The second result is undefined, although Chrome replays the cached body as status 200.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: Development and production fail on HEAD and rc.13; HEAD also fails with observe (production runtime plus optional instrumentation).

### Additional context

A 304 response reuses the cached body. Replacing its representation header without replacing the body makes the decoder consume the wrong format.

Development additionally warns that a scripted call returned 304, despite the browser-generated conditional request.

Related: [#3101](https://github.com/solidjs/solid/issues/3101), [#3134](https://github.com/solidjs/solid/issues/3134)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format/README.md).

Copy [the standalone folder](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format/build.ts)
- [client.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format/client.ts)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format/link-head.ts)
- [read.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format/read.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format/repro.test.ts)
- [server.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/11-conditional-get-format/server.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
