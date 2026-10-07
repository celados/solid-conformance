# 304 format header overwrites cached GET representation

Browser-managed conditional GET should replay cached {value:17}. Both client fetches see 200, but the second decoded result is undefined.

```ts
import { getRequestEvent, respond } from "@solidjs/web";
export const calls: (string | null)[] = [];

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

The next run fails its desired-behavior assertion: The second result is undefined, although Chrome replays the cached body as status 200.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`. Development and production fail on HEAD and rc.13; HEAD also fails with observe (production runtime plus optional instrumentation).

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **0 pass / 1 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 1 fail** in development. Typical failing output (test timing varies):

```text
RFC10 browser owns conditional GET exchange development [11026.27ms]
0 pass
1 fail
```

## Files

The displayed source is [read.ts](./read.ts). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
