---
type: "Issue"
title: "[2.0 rc.13 + next] Synchronous lazy asset resolver failure aborts SSR"
status: "filed"
tier: "A"
severity: "med"
findings: ["032"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "server.tsx"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
filed: "https://github.com/solidjs/solid/issues/3896"
---

### Describe the bug

Asset hint resolution should not prevent component HTML from rendering. A rejected resolver promise preserves HTML, while a synchronous throw aborts SSR.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/10-sync-asset-resolver)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

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

2. Run on the server with Solid JSX compilation. Call `await sample(false)`, then `await sample(true)`. The first returns `{ rendered: true, error: null }`; the second returns `{ rendered: false, error: "resolver-failed" }`.

### Expected behavior

**Expected:** An asset-hint resolver failure does not prevent the component HTML from rendering.
**Actual:** Only a synchronous resolver throw aborts SSR; a rejected resolver promise preserves HTML.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: Development and production fail on HEAD and rc.13.

### Additional context

Asset hints are advisory. The synchronous and asynchronous failure paths should both preserve otherwise renderable component HTML.

Related: No matching issue found in the recorded open/closed searches of Solid, Router and Start.

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/10-sync-asset-resolver/README.md).

Copy [the standalone folder](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/10-sync-asset-resolver) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/10-sync-asset-resolver/build.ts)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/10-sync-asset-resolver/link-head.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/10-sync-asset-resolver/repro.test.ts)
- [server.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/10-sync-asset-resolver/server.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
