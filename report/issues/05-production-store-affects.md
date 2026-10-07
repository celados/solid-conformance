---
type: Issue
title: "Production tree shaking removes store affects registration"
status: draft
tier: A
severity: high
findings: ['016']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: App.tsx
snippet_kind: component
---

# Production tree shaking removes store affects registration

Declaring an affected store slot inside an action rejects in a tree-shaken production bundle.

```tsx
import { action, affects, createSignal, createStore } from "solid-js";
export default function App() {
  const [store] = createStore({ n: 1 });
  const [result, setResult] = createSignal("idle");
  const save = action(function* () {
    affects(store, "n");
  });
  function run() {
    save().then(
      () => setResult("ok"),
      (error) => setResult(String(error)),
    );
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Declare pending slot
      </button>
      <output id="answer">{result()}</output>
    </>
  ); // In a tree-shaken production bundle: a registration-hook error.
}
```

Paste this App into a fresh Solid 2 app using the Bun bundler setup below. Build for production and click **Declare pending slot**.

**Expected:** The output becomes ok.
**Actual:** The output displays a missing registration-hook TypeError.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; production fail. rc.13 passes in both builds.

Disabling tree shaking and ignoring DCE annotations passes; the private mangled hook name is not a stable API.

Related: [#2887](https://github.com/solidjs/solid/issues/2887)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/05-production-store-affects/) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](../repros/05-production-store-affects/App.tsx)
- [build.ts](../repros/05-production-store-affects/build.ts)
- [link-head.ts](../repros/05-production-store-affects/link-head.ts)
- [module.ts](../repros/05-production-store-affects/module.ts)
- [repro.test.ts](../repros/05-production-store-affects/repro.test.ts)
- [snippet-client.tsx](../repros/05-production-store-affects/snippet-client.tsx)
- [snippet.test.ts](../repros/05-production-store-affects/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=production bun test ./snippet.test.ts
NO_TREE_SHAKE=1 BUILD_MODE=production bun test ./repro.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
