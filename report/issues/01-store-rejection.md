---
type: Issue
title: "Replacement derived-store rejection never reaches Errored"
status: draft
tier: A
severity: high
findings: ['004']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: App.tsx
snippet_kind: component
---

# Replacement derived-store rejection never reaches Errored

A derived store can lose the rejection of a replacement request instead of routing it to the surrounding error boundary.

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

Paste this App into a Solid 2 playground. Click **Replace and reject**, then wait.

**Expected:** The error fallback displays error.
**Actual:** The previous value 0 remains visible.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; development and production fail. rc.13 passes in both builds.

Related: [#2997](https://github.com/solidjs/solid/issues/2997), [#3769](https://github.com/solidjs/solid/issues/3769)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/01-store-rejection/) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](../repros/01-store-rejection/App.tsx)
- [build.ts](../repros/01-store-rejection/build.ts)
- [client.tsx](../repros/01-store-rejection/client.tsx)
- [link-head.ts](../repros/01-store-rejection/link-head.ts)
- [repro.test.ts](../repros/01-store-rejection/repro.test.ts)
- [snippet-client.tsx](../repros/01-store-rejection/snippet-client.tsx)
- [snippet.test.ts](../repros/01-store-rejection/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
