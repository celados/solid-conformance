---
type: "Issue"
title: "[2.0 next, regressed after rc.13] Replacement derived-store rejection never reaches Errored"
status: "draft"
tier: "A"
severity: "high"
findings: ["004"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "App.tsx"
snippet_kind: "component"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

A derived store can lose the rejection of a replacement request instead of routing it to the surrounding error boundary.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```tsx
import { createSignal, createStore, Errored, Loading } from "solid-js";
export default function App() {
  let reject!: (error: Error) => void;
  const replacement = new Promise<{ value: number }>((_, fail) => {
    reject = fail;
  });
  const [id, setId] = createSignal(0);
  const [store] = createStore(() => (id() ? replacement : { value: 0 }), { value: 0 });
  function replace() {
    setId(1); // Start a replacement request.
    setTimeout(() => reject(new Error("replacement failed")), 20);
  }
  return (
    <>
      <button id="trigger" onClick={replace}>
        Replace and reject
      </button>
      <Errored fallback={() => <b id="answer">error</b>}>
        <Loading fallback={<i>pending</i>}>
          <span id="answer">{store.value}</span>
        </Loading>
      </Errored>
    </>
  ); // After the click: still 0, instead of the error fallback.
}
```

2. Paste this App into a Solid 2 playground. Click **Replace and reject**, then wait.

### Expected behavior

**Expected:** The error fallback displays error.
**Actual:** The previous value 0 remains visible.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: development and production fail. rc.13 passes in both builds.

### Additional context

The surrounding Errored boundary should handle rejection of the data it displays; keeping the old successful value hides the failed request.

Related: [#2997](https://github.com/solidjs/solid/issues/2997), [#3769](https://github.com/solidjs/solid/issues/3769)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/README.md).

Copy [the standalone files](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/App.tsx)
- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/build.ts)
- [client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/client.tsx)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/link-head.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/repro.test.ts)
- [snippet-client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/snippet-client.tsx)
- [snippet.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/01-store-rejection/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
