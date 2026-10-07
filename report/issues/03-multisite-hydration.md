---
type: "Issue"
title: "[2.0 rc.13 + next] Second mount of a shared server-component factory fails hydration"
status: "draft"
tier: "A"
severity: "high"
findings: ["011"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "app.tsx"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

Two consumption sites should retain independent hydrated client slots. CSR has two working buttons; hydration loses the second mount.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

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

2. Requires server-component SSR and hydration, not CSR alone. The endpoint returns `props => <props.counter />`; `Counter` is a local `createSignal(0)` button. Mount `App`, SSR-render it, then hydrate: only one button remains. The CSR control has two independently clickable buttons.

### Expected behavior

**Expected:** Both mounts retain their own interactive counter after hydration.
**Actual:** Hydration removes the second button; CSR works.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: Development and production fail on HEAD and rc.13.

### Additional context

A reusable server-component factory should work at each consumption site. The client-only comparison succeeds.

Related: [#2973](https://github.com/solidjs/solid/issues/2973)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/README.md).

Copy [the standalone folder](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [app.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/app.tsx)
- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/build.ts)
- [client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/client.tsx)
- [counter.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/counter.tsx)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/link-head.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/repro.test.ts)
- [server.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/03-multisite-hydration/server.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
