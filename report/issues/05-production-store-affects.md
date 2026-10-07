---
type: "Issue"
title: "[2.0 next, regressed after rc.13] Production tree shaking removes store affects registration (production build)"
status: "draft"
tier: "A"
severity: "high"
findings: ["016"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "App.tsx"
snippet_kind: "component"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

Declaring an affected store slot inside an action rejects in a tree-shaken production bundle.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

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

2. Paste this App into a fresh Solid 2 app using the Bun bundler setup below. Build for production and click **Declare pending slot**.

### Expected behavior

**Expected:** The output becomes ok.
**Actual:** The output displays a missing registration-hook TypeError.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: production fail. rc.13 passes in both builds.

### Additional context

affects(store, key) is a public action primitive. Tree shaking should preserve its required registration, as the development comparison does.

Disabling tree shaking and ignoring DCE annotations passes; the private mangled hook name is not a stable API.

Related: [#2887](https://github.com/solidjs/solid/issues/2887)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/README.md).

Copy [the standalone files](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/App.tsx)
- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/build.ts)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/link-head.ts)
- [module.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/module.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/repro.test.ts)
- [snippet-client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/snippet-client.tsx)
- [snippet.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/05-production-store-affects/snippet.test.ts)

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
