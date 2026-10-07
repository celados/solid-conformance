---
type: Issue
title: "Production refresh remains pending after a settled computation"
status: draft
tier: A
severity: high
findings: ['008']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: App.tsx
snippet_kind: component
---

# Production refresh remains pending after a settled computation

A production refresh stays pending even when its computation returns an already-resolved promise.

```tsx
import { createMemo, createSignal, refresh, resolve } from "solid-js";
export default function App() {
  let calls = 0;
  const value = createMemo(() => Promise.resolve(++calls));
  const [result, setResult] = createSignal("idle");
  async function run() {
    await resolve(value); // The first computation has settled with 1.
    setResult("refreshing");
    setResult(String(await refresh(value))); // Production never reaches this write.
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Refresh
      </button>
      <output id="answer">{result()}</output>
    </>
  ); // Click: development shows 2; production remains refreshing.
}
```

Paste this App into a fresh Solid 2 app. Build for production, click **Refresh**, and wait at least 200 ms.

**Expected:** The output becomes 2, as it does in development.
**Actual:** The output remains refreshing in production.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; production fail. rc.13 passes in both builds.

Related: [#3738](https://github.com/solidjs/solid/issues/3738), [#3178](https://github.com/solidjs/solid/issues/3178)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/02-production-refresh/) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](../repros/02-production-refresh/App.tsx)
- [build.ts](../repros/02-production-refresh/build.ts)
- [client.tsx](../repros/02-production-refresh/client.tsx)
- [link-head.ts](../repros/02-production-refresh/link-head.ts)
- [repro.test.ts](../repros/02-production-refresh/repro.test.ts)
- [snippet-client.tsx](../repros/02-production-refresh/snippet-client.tsx)
- [snippet.test.ts](../repros/02-production-refresh/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=production bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
