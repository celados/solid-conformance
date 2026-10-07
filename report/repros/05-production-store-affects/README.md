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

Default build: **production**. Select another with `BUILD_MODE=production` or `BUILD_MODE=development` before the command. Linking accepts a **built Solid source directory containing packages/**, not the conformance repository itself.

## Expected output

The next run fails its desired-behavior assertion: The output displays a missing registration-hook TypeError.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`; production fail. rc.13 passes in both builds.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **2 pass / 0 fail** in production. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 2 fail** in production. Typical failing output (test timing varies):

```text
RFC 06 production affects(store,key) must not throw [13.82ms]
Readable App reproduces 05-production-store-affects [11238.10ms]
Expected: "ok"
Received: "TypeError: GlobalQueue.O is not a function"
0 pass
2 fail
```

## Files

The displayed source is [App.tsx](./App.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
