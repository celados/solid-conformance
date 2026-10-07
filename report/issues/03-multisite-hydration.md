---
type: Issue
title: "Second mount of a shared server-component factory fails hydration"
status: draft
tier: A
severity: high
findings: ['011']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: app.tsx
---

# Second mount of a shared server-component factory fails hydration

Two consumption sites should retain independent hydrated client slots. CSR has two working buttons; hydration loses the second mount.

```tsx
import { createMemo, Loading } from "solid-js";
import { dynamic, isServer } from "@solidjs/web";
import { GET, createServerReference } from "@solidjs/web/server-functions";
import { Counter } from "./counter";
export const source: any = {};
// SSR-render and hydrate App: the second Counter disappears.
export function App() {
  const value = createMemo(() =>
    isServer ? source.read() : GET((createServerReference as any)("multisite"))(),
  );
  const Frame = dynamic(() => value() as any);
  return (
    <Loading fallback="pending">
      <Frame counter={Counter} />
      <Frame counter={Counter} />
    </Loading>
  );
}
```

Requires server-component SSR and hydration, not CSR alone. The endpoint returns `props => <props.counter />`; `Counter` is a local `createSignal(0)` button. Mount `App`, SSR-render it, then hydrate: only one button remains. The CSR control has two independently clickable buttons.

**Expected:** Both mounts retain their own interactive counter after hydration.
**Actual:** Hydration removes the second button; CSR works.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`. Development and production fail on HEAD and rc.13.

Related: [#2973](https://github.com/solidjs/solid/issues/2973)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone folder](../repros/03-multisite-hydration/) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [app.tsx](../repros/03-multisite-hydration/app.tsx)
- [build.ts](../repros/03-multisite-hydration/build.ts)
- [client.tsx](../repros/03-multisite-hydration/client.tsx)
- [counter.tsx](../repros/03-multisite-hydration/counter.tsx)
- [link-head.ts](../repros/03-multisite-hydration/link-head.ts)
- [repro.test.ts](../repros/03-multisite-hydration/repro.test.ts)
- [server.tsx](../repros/03-multisite-hydration/server.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
