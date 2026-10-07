---
type: Issue
title: "Synchronous lazy asset resolver failure aborts SSR"
status: draft
tier: A
severity: med
findings: ['032']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: server.tsx
---

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

Run on the server with Solid JSX compilation. Call `await sample(false)`, then `await sample(true)`. The first returns `{ rendered: true, error: null }`; the second returns `{ rendered: false, error: "resolver-failed" }`.

**Expected:** An asset-hint resolver failure does not prevent the component HTML from rendering.
**Actual:** Only a synchronous resolver throw aborts SSR; a rejected resolver promise preserves HTML.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`. Development and production fail on HEAD and rc.13.

Related: No matching issue found in the recorded open/closed searches of Solid, Router and Start.

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone folder](../repros/10-sync-asset-resolver/) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](../repros/10-sync-asset-resolver/build.ts)
- [link-head.ts](../repros/10-sync-asset-resolver/link-head.ts)
- [repro.test.ts](../repros/10-sync-asset-resolver/repro.test.ts)
- [server.tsx](../repros/10-sync-asset-resolver/server.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
