# Open decoded iterators are missed when a response dies

A dropped live response should reconnect; a non-live iterator pull should reject. Instead live closes normally and a decoded pull stays pending.

```ts
export async function pullAfterTransportDeath(iterator: AsyncIterator<unknown>, cut: () => void) {
  const next = iterator.next().then(
    (value) => ({ outcome: "resolved", value }),
    (error) => ({ outcome: "rejected", message: error.message }),
  );
  // Close or error the response body while next() is pending.
  cut();
  // Both paths leave this pull pending instead of rejecting it.
  return Promise.race([
    next,
    new Promise((resolve) => setTimeout(() => resolve({ outcome: "pending" }), 300)),
  ]);
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

The next run fails its desired-behavior assertion: The pull remains pending, and live reports closed instead of reconnecting.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`. Development and production fail on HEAD and rc.13. The decoder case also fails with the observe export (production runtime plus optional instrumentation).

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **0 pass / 3 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 3 fail** in development. Typical failing output (test timing varies):

```text
A connected live source must reconnect after a real TCP drop [12674.18ms]
RFC10 dying body rejects an open iterator pull: error [328.81ms]
RFC10 dying body rejects an open iterator pull: eof [315.44ms]
Expected: "rejected"
Received: "pending"
0 pass
3 fail
```

## Files

The displayed source is [pull.ts](./pull.ts). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
