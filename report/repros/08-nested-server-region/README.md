# Nested server region stays stale after refetch then argument change

Refetching argument 1 and then requesting 2 should update the nested server span to 2; it stays 1.

```tsx
import { createSignal, Loading, flush } from "solid-js";
import { render, dynamic } from "@solidjs/web";
import { createServerReference } from "@solidjs/web/server-functions/client";
import { installServerComponents } from "@solidjs/web/frames";
installServerComponents();
const get = createServerReference("region");
const [id, setId] = createSignal(1);
const [version, setVersion] = createSignal(0);
const Component = dynamic(() => {
  version();
  return get(id()) as any;
});
render(
  () => (
    <Loading fallback={<b>pending</b>}>
      <Component wrap={(p: any) => <section>{p.children}</section>} />
    </Loading>
  ),
  document.getElementById("root")!,
);
// First call refetch(), then change(): the nested span stays at 1.
(window as any).refetch = () => {
  setVersion(1);
  flush();
};
(window as any).change = () => {
  setId(2);
  flush();
};
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

The next run fails its desired-behavior assertion: The nested region stays at 1.

Version/build comparison: HEAD `3086f1b77cd7b0431d3a7f768c2984c335758633`. Development and production fail on HEAD and rc.13.

The refreshed next SHA is `3086f1b77cd7b0431d3a7f768c2984c335758633`. The rc.13 runner was rerun: **0 pass / 1 fail** in development. A passing rc.13/development comparison is an intentional control, not a broken runner.

The next runner was verified: **0 pass / 1 fail** in development. Typical failing output (test timing varies):

```text
A new server-function argument must replace nested server slot content [11603.64ms]
Expected: "2"
Received: "1"
0 pass
1 fail
```

## Files

The displayed source is [client.tsx](./client.tsx). `*.test.ts` contains assertions; `build.ts` (where present) supplies JSX compilation; `link-head.ts` selects a built next tree. Server/transport/hydration examples require the complete workflow in these files.
