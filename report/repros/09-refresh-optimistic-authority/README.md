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

The next run fails its desired-behavior assertion: The output becomes 99, the action’s optimistic guess.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`; development and production fail. rc.13 passes in both builds.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **2 pass / 0 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 2 fail** in development. Typical failing output (test timing varies):

```text
06-actions-optimistic.md: refresh delivers source truth, never the caller optimistic override [18.41ms]
Readable App reproduces 09-refresh-optimistic-authority [11189.04ms]
Expected: 2
Received: 99
0 pass
2 fail
```

## Files

The displayed source is [App.tsx](./App.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
