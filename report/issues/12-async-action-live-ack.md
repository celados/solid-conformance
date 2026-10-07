---
type: "Issue"
title: "[2.0 next, regressed after rc.13] Async-generator action times out on its authoritative live echo"
status: "draft"
tier: "A"
severity: "med"
findings: ["053"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "App.tsx"
snippet_kind: "component"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

An async-generator action can time out waiting for a live acknowledgement even after the real source contains that acknowledgement.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```tsx
import { action, createOptimisticStore, createSignal, flush, until } from "solid-js";
export default function App() {
  const [source, setSource] = createSignal<{ clientId: string }[]>([]);
  const [rows, setRows] = createOptimisticStore(() => source(), []);
  const [result, setResult] = createSignal("idle");
  const save = action(async function* () {
    setRows((draft) => {
      draft.push({ clientId: "c1" });
    });
    await 0; // Fire-and-forget send resumes outside the action context.
    yield until(() => rows.some((row) => row.clientId === "c1"), { timeout: 100 });
  });
  function run() {
    setResult("waiting");
    save().then(
      () => setResult("confirmed"),
      (error) => setResult(String(error)),
    );
    setTimeout(() => {
      setSource([{ clientId: "c1" }]);
      flush();
    }, 20);
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Send and acknowledge
      </button>
      <output id="answer">{result()}</output>
    </>
  ); // The real source acknowledges c1, but HEAD times out.
}
```

2. Paste into a Solid 2 playground. Click **Send and acknowledge**, then wait 100 ms.

### Expected behavior

**Expected:** The output becomes confirmed after the source receives c1.
**Actual:** HEAD displays TimeoutError.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: development and production fail. rc.13 passes in both builds.

### Additional context

The real source contains the acknowledged row, yet the action continues waiting until its timeout. Adding a yield after await avoids the failure.

Adding a bare yield after await 0 avoids the timeout. rc.13 needs no such change; the intended context requirement remains an upstream decision.

Related: [#3687](https://github.com/solidjs/solid/issues/3687)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/README.md).

Copy [the standalone files](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/App.tsx)
- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/build.ts)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/link-head.ts)
- [module.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/module.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/repro.test.ts)
- [snippet-client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/snippet-client.tsx)
- [snippet.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/12-async-action-live-ack/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
