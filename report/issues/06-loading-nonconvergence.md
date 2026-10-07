---
type: Issue
title: "Loading on latest remains in fallback after a shared source settles"
status: draft
tier: A
severity: high
findings: ['029']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: App.tsx
snippet_kind: component
---

# Loading on latest remains in fallback after a shared source settles

A Loading boundary using latest(id) keeps its fallback after the source shared by both boundaries has resolved.

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

Paste into a Solid 2 playground. Wait for **11**, then click **Load 2** and wait.

**Expected:** Both boundaries display the final value: 22.
**Actual:** The first boundary keeps its fallback: A2.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; development and production fail. rc.13 passes in both builds.

Related: [#2706](https://github.com/solidjs/solid/issues/2706), [#2829](https://github.com/solidjs/solid/issues/2829), [#3524](https://github.com/solidjs/solid/issues/3524)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/06-loading-nonconvergence/) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](../repros/06-loading-nonconvergence/App.tsx)
- [build.ts](../repros/06-loading-nonconvergence/build.ts)
- [client.tsx](../repros/06-loading-nonconvergence/client.tsx)
- [link-head.ts](../repros/06-loading-nonconvergence/link-head.ts)
- [repro.test.ts](../repros/06-loading-nonconvergence/repro.test.ts)
- [snippet-client.tsx](../repros/06-loading-nonconvergence/snippet-client.tsx)
- [snippet.test.ts](../repros/06-loading-nonconvergence/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
