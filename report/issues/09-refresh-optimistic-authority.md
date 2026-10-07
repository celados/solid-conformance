---
type: "Issue"
title: "[2.0 next, regressed after rc.13] Awaited refresh returns the caller optimistic override"
status: "draft"
tier: "A"
severity: "med"
findings: ["022"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "App.tsx"
snippet_kind: "component"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

Refreshing an optimistic accessor inside its own action returns the optimistic guess instead of the source answer.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```tsx
import { action, createOptimistic, createSignal, refresh, resolve } from "solid-js";
export default function App() {
  const [value, setValue] = createOptimistic(() => Promise.resolve(2));
  const [result, setResult] = createSignal("idle");
  const save = action(function* () {
    setValue(99); // The caller's optimistic guess, not server truth.
    return yield refresh(value);
  });
  async function run() {
    await resolve(value);
    setResult(String(await save())); // Observed 99; the source returns 2.
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Refresh inside action
      </button>
      <output id="answer">{result()}</output>
    </>
  );
}
```

2. Paste into a Solid 2 playground. Click **Refresh inside action** and wait.

### Expected behavior

**Expected:** The output becomes 2, the value produced by the source.
**Actual:** The output becomes 99, the action’s optimistic guess.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: development and production fail. rc.13 passes in both builds.

### Additional context

Refresh requests authoritative data; the caller's optimistic overlay must not become that authoritative result.



<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/README.md).

Copy [the standalone files](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/App.tsx)
- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/build.ts)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/link-head.ts)
- [module.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/module.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/repro.test.ts)
- [snippet-client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/snippet-client.tsx)
- [snippet.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/09-refresh-optimistic-authority/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
