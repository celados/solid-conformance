---
type: Issue
title: "Awaited refresh returns the caller optimistic override"
status: draft
tier: A
severity: med
findings: ['022']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: App.tsx
snippet_kind: component
---

# Awaited refresh returns the caller optimistic override

Refreshing an optimistic accessor inside its own action returns the optimistic guess instead of the source answer.

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

Paste into a Solid 2 playground. Click **Refresh inside action** and wait.

**Expected:** The output becomes 2, the value produced by the source.
**Actual:** The output becomes 99, the action’s optimistic guess.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; development and production fail. rc.13 passes in both builds.

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/09-refresh-optimistic-authority/) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](../repros/09-refresh-optimistic-authority/App.tsx)
- [build.ts](../repros/09-refresh-optimistic-authority/build.ts)
- [link-head.ts](../repros/09-refresh-optimistic-authority/link-head.ts)
- [module.ts](../repros/09-refresh-optimistic-authority/module.ts)
- [repro.test.ts](../repros/09-refresh-optimistic-authority/repro.test.ts)
- [snippet-client.tsx](../repros/09-refresh-optimistic-authority/snippet-client.tsx)
- [snippet.test.ts](../repros/09-refresh-optimistic-authority/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
