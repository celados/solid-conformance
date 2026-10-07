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

## Run

Requires Bun and system Google Chrome. The runner creates a temporary project, installs the exact rc.13 Solid packages with Bun, and removes it after the tests. It never downloads a browser and runs each test file in a separate process. Assertion failures intentionally exit 1.

From this directory, one command sets up and runs the rc.13 comparison:

```sh
bun run run.ts rc13
```

For next, first build Solid (the conformance repo root supplies `bun install --frozen-lockfile && bun run upstream`; the built checkout path is recorded in `.upstream/active.json`). Then one command installs, links the five matching built packages, and runs:

```sh
bun run run.ts next /absolute/path/to/built/solid
```

Default build: **development**. Select another with `BUILD_MODE=production` or `BUILD_MODE=development` before the command. Linking accepts a **built Solid source directory containing packages/**, not the conformance repository itself.

## Expected output

The next run fails its desired-behavior assertion: HEAD displays TimeoutError.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`; development and production fail. rc.13 passes in both builds.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **2 pass / 0 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 2 fail** in development. Typical failing output (test timing varies):

```text
06-actions-optimistic.md C166: await fire-and-forget send then until waits for the authoritative live echo [132.71ms]
Readable App reproduces 12-async-action-live-ack [11204.88ms]
Expected: "confirmed"
Received: "TimeoutError: Timed out waiting for condition"
0 pass
2 fail
```

## Files

The displayed source is [App.tsx](./App.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
