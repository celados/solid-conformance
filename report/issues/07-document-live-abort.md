---
type: Issue
title: "Aborted document closes a live-hole channel twice"
status: draft
tier: A
severity: high
findings: ['049']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: document.tsx
---

# Aborted document closes a live-hole channel twice

Abort followed by producer completion should clean up once. Instead an uncaught Controller is already closed TypeError escapes the document live channel.

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

Requires server-side streaming. Pass an async generator that yields 1 and then waits. Once 1 has streamed, call the returned `abort()`, then release the generator. The normal-completion control cleans up once.

**Expected:** Abort and later producer completion clean up without an uncaught exception.
**Actual:** Producer completion throws TypeError: "Controller is already closed".

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`. Development, production, and observe fail on HEAD and rc.13. Observe is the production runtime with optional instrumentation.

Related: [#3768](https://github.com/solidjs/solid/issues/3768)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone folder](../repros/07-document-live-abort/) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](../repros/07-document-live-abort/build.ts)
- [document.tsx](../repros/07-document-live-abort/document.tsx)
- [link-head.ts](../repros/07-document-live-abort/link-head.ts)
- [repro.test.ts](../repros/07-document-live-abort/repro.test.ts)
- [server.tsx](../repros/07-document-live-abort/server.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
