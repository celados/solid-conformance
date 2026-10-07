# Production refresh remains pending after a settled computation

A production refresh stays pending even when its computation returns an already-resolved promise.

```tsx
import { createMemo, createSignal, refresh, resolve } from "solid-js";
export default function App() {
  let calls = 0;
  const value = createMemo(() => Promise.resolve(++calls));
  const [result, setResult] = createSignal("idle");
  async function run() {
    await resolve(value); // The first computation has settled with 1.
    setResult("refreshing");
    setResult(String(await refresh(value))); // Production never reaches this write.
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Refresh
      </button>
      <output id="answer">{result()}</output>
    </>
  ); // Click: development shows 2; production remains refreshing.
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

The next run fails its desired-behavior assertion: The output remains refreshing in production.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`; production fail. rc.13 passes in both builds.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **2 pass / 0 fail** in production. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 2 fail** in production. Typical failing output (test timing varies):

```text
Production refresh remains pending after a settled computation [11380.07ms]
Readable App reproduces 02-production-refresh [11383.49ms]
Expected: "<span>2</span>"
Received: "<span>timeout</span>"
0 pass
2 fail
```

## Files

The displayed source is [App.tsx](./App.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
