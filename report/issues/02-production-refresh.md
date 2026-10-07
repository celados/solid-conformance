---
type: "Issue"
title: "[2.0 next, regressed after rc.13] Production refresh remains pending after a settled computation (production build)"
status: "draft"
tier: "A"
severity: "high"
findings: ["008"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "App.tsx"
snippet_kind: "component"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

A production refresh stays pending even when its computation returns an already-resolved promise.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

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

2. Paste this App into a fresh Solid 2 app. Build for production, click **Refresh**, and wait at least 200 ms.

### Expected behavior

**Expected:** The output becomes 2, as it does in development.
**Actual:** The output remains refreshing in production.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: production fail. rc.13 passes in both builds.

### Additional context

Awaiting refresh is part of the public async action flow. A promise that never settles prevents the caller from completing.

Related: [#3738](https://github.com/solidjs/solid/issues/3738), [#3178](https://github.com/solidjs/solid/issues/3178)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/README.md).

Copy [the standalone files](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/App.tsx)
- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/build.ts)
- [client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/client.tsx)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/link-head.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/repro.test.ts)
- [snippet-client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/snippet-client.tsx)
- [snippet.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/02-production-refresh/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=production bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
