# Synchronous lazy asset resolver failure aborts SSR

Asset hint resolution should not prevent component HTML from rendering. A rejected resolver promise preserves HTML, while a synchronous throw aborts SSR.

```tsx
import { lazy } from "solid-js";
import { renderToStream } from "@solidjs/web";
export async function sample(sync: boolean) {
  const error = new Error("resolver-failed");
  const Part = lazy(async () => ({ default: () => <span>available</span> }), undefined, "part.tsx");
  try {
    const html = await renderToStream(() => <Part />, {
      manifest: () => {
        // Calling sample(true) aborts HTML rendering; sample(false) succeeds.
        if (sync) throw error;
        return Promise.reject(error);
      },
    });
    return { rendered: html.includes("available"), error: null };
  } catch (caught) {
    return { rendered: false, error: caught === error ? error.message : String(caught) };
  }
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

The next run fails its desired-behavior assertion: Only a synchronous resolver throw aborts SSR; a rejected resolver promise preserves HTML.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`. Development and production fail on HEAD and rc.13.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **0 pass / 1 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 1 fail** in development. Typical failing output (test timing varies):

```text
a failed lazy asset resolver preserves server component HTML [25.00ms]
0 pass
1 fail
```

## Files

The displayed source is [server.tsx](./server.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
