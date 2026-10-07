# Loading on latest remains in fallback after a shared source settles

A Loading boundary using latest(id) keeps its fallback after the source shared by both boundaries has resolved.

```tsx
import { createMemo, createSignal, latest, Loading } from "solid-js";
export default function App() {
  let finish!: (value: number) => void;
  const replacement = new Promise<number>((resolve) => {
    finish = resolve;
  });
  const [id, setId] = createSignal(0);
  const data = createMemo(() => (id() ? replacement : Promise.resolve(1)));
  function load() {
    setId(1); // Replace the source shared by both boundaries.
    setTimeout(() => finish(2), 20); // Every async source is now settled.
  }
  return (
    <>
      <button id="trigger" onClick={load}>
        Load 2
      </button>
      <div id="answer">
        <Loading on={latest(id)} fallback="A">
          <span>{data()}</span>
        </Loading>
        <Loading fallback="B">
          <b>{data()}</b>
        </Loading>
      </div>
    </>
  ); // Wait for 11, then click: it stays A2 rather than becoming 22.
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

The next run fails its desired-behavior assertion: The first boundary keeps its fallback: A2.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`; development and production fail. rc.13 passes in both builds.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **2 pass / 0 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 2 fail** in development. Typical failing output (test timing varies):

```text
Loading on latest(id) converges after its shared source lands [12364.24ms]
Readable App reproduces 06-loading-nonconvergence [11418.01ms]
Expected: "22"
Received: "A2"
0 pass
2 fail
```

## Files

The displayed source is [App.tsx](./App.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
