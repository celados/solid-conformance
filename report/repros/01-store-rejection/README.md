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

The next run fails its desired-behavior assertion: The previous value 0 remains visible.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`; development and production fail. rc.13 passes in both builds.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **2 pass / 0 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 2 fail** in development. Typical failing output (test timing varies):

```text
Replacement derived-store rejection never reaches Errored [11266.51ms]
Readable App reproduces 01-store-rejection [11336.75ms]
Expected: "<b>error</b>"
Received: "<span>0</span>"
0 pass
2 fail
```

## Files

The displayed source is [App.tsx](./App.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
