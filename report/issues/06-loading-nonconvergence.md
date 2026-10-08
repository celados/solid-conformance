---
type: "Issue"
title: "[2.0 next, regressed after rc.13] Loading on latest remains in fallback after a shared source settles"
status: "filed"
tier: "A"
severity: "high"
findings: ["029"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "App.tsx"
snippet_kind: "component"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
filed: "https://github.com/solidjs/solid/issues/3892"
---

### Describe the bug

A Loading boundary using latest(id) keeps its fallback after the source shared by both boundaries has resolved.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```tsx
import { createMemo, createSignal, latest, Loading } from "solid-js";
export default function App() {
  let finish!: (value: number) => void;
  const replacement = new Promise<number>((resolve) => {
    finish = resolve;
  });
  const [id, setId] = createSignal(0);
  const data = createMemo(() => (id() ? replacement : Promise.resolve(1)));
  function load() {
    setId(1); // Replace the source shared by both boundaries.
    setTimeout(() => finish(2), 20); // Every async source is now settled.
  }
  return (
    <>
      <button id="trigger" onClick={load}>
        Load 2
      </button>
      <div id="answer">
        <Loading on={latest(id)} fallback="A">
          <span>{data()}</span>
        </Loading>
        <Loading fallback="B">
          <b>{data()}</b>
        </Loading>
      </div>
    </>
  ); // Wait for 11, then click: it stays A2 rather than becoming 22.
}
```

2. Paste into a Solid 2 playground. Wait for **11**, then click **Load 2** and wait.

### Expected behavior

**Expected:** Both boundaries display the final value: 22.
**Actual:** The first boundary keeps its fallback: A2.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: development and production fail. rc.13 passes in both builds.

### Additional context

Both Loading boundaries read the same settled source, so both should leave their fallback without another user update.

Related: [#2706](https://github.com/solidjs/solid/issues/2706), [#2829](https://github.com/solidjs/solid/issues/2829), [#3524](https://github.com/solidjs/solid/issues/3524)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/README.md).

Copy [the standalone files](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/App.tsx)
- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/build.ts)
- [client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/client.tsx)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/link-head.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/repro.test.ts)
- [snippet-client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/snippet-client.tsx)
- [snippet.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/06-loading-nonconvergence/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
