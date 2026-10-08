---
type: "Issue"
title: "[2.0 rc.13 + next] Aborted document closes a live-hole channel twice"
status: "filed"
tier: "A"
severity: "high"
findings: ["049"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "document.tsx"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
filed: "https://github.com/solidjs/solid/issues/3893"
---

### Describe the bug

Abort followed by producer completion should clean up once. Instead an uncaught Controller is already closed TypeError escapes the document live channel.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```tsx
import { createMemo } from "solid-js";
import { renderToStream } from "@solidjs/web";
import { frameTransformDirectResult } from "@solidjs/web/frames/server";

export function startDocument(values: () => AsyncIterable<number>) {
  const Component = frameTransformDirectResult(
    () => {
      const value = createMemo(values);
      return <b>{value()}</b>;
    },
    { id: "minimal" },
  );
  const controller = new AbortController();
  let html = "";
  const stream = renderToStream(() => Component(), {
    signal: controller.signal,
    onError() {},
  });
  stream.pipe({
    write: (chunk) => {
      html += String(chunk);
    },
    end() {},
  });
  // After the first value, abort(), then finish the source.
  // Source completion throws "Controller is already closed".
  return { abort: () => controller.abort(), html: () => html };
}
```

2. Requires server-side streaming. Pass an async generator that yields 1 and then waits. Once 1 has streamed, call the returned `abort()`, then release the generator. The normal-completion control cleans up once.

### Expected behavior

**Expected:** Abort and later producer completion clean up without an uncaught exception.
**Actual:** Producer completion throws TypeError: "Controller is already closed".

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: Development, production, and observe fail on HEAD and rc.13. Observe is the production runtime with optional instrumentation.

### Additional context

Aborting one document should close its live channel once. Double close rejects with an invalid stream state during cleanup.

Related: [#3768](https://github.com/solidjs/solid/issues/3768)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort/README.md).

Copy [the standalone folder](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort/build.ts)
- [document.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort/document.tsx)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort/link-head.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort/repro.test.ts)
- [server.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/07-document-live-abort/server.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
