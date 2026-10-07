---
type: Issue
title: "Async-generator action times out on its authoritative live echo"
status: draft
tier: A
severity: med
findings: ['053']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: App.tsx
snippet_kind: component
---

# Async-generator action times out on its authoritative live echo

An async-generator action can time out waiting for a live acknowledgement even after the real source contains that acknowledgement.

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

Paste into a Solid 2 playground. Click **Send and acknowledge**, then wait 100 ms.

**Expected:** The output becomes confirmed after the source receives c1.
**Actual:** HEAD displays TimeoutError.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; development and production fail. rc.13 passes in both builds.

Adding a bare yield after await 0 avoids the timeout. rc.13 needs no such change; the intended context requirement remains an upstream decision.

Related: [#3687](https://github.com/solidjs/solid/issues/3687)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/12-async-action-live-ack/) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](../repros/12-async-action-live-ack/App.tsx)
- [build.ts](../repros/12-async-action-live-ack/build.ts)
- [link-head.ts](../repros/12-async-action-live-ack/link-head.ts)
- [module.ts](../repros/12-async-action-live-ack/module.ts)
- [repro.test.ts](../repros/12-async-action-live-ack/repro.test.ts)
- [snippet-client.tsx](../repros/12-async-action-live-ack/snippet-client.tsx)
- [snippet.test.ts](../repros/12-async-action-live-ack/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
