---
type: Issue
title: "Nested server region stays stale after refetch then argument change"
status: draft
tier: A
severity: med
findings: ['009']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: client.tsx
---

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

Requires a server-component endpoint `region(id)` returning `props => <main><props.wrap><span>{id}</span></props.wrap></main>`. Wait for 1, call `window.refetch()`, wait for that response, then call `window.change()`. The nested section still shows 1.

**Expected:** Changing the server-function argument to 2 replaces the nested content with 2.
**Actual:** The nested region stays at 1.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`. Development and production fail on HEAD and rc.13.

Related: [#2965](https://github.com/solidjs/solid/issues/2965), [#2974](https://github.com/solidjs/solid/issues/2974), [#2966](https://github.com/solidjs/solid/issues/2966)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone folder](../repros/08-nested-server-region/) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](../repros/08-nested-server-region/build.ts)
- [client.tsx](../repros/08-nested-server-region/client.tsx)
- [link-head.ts](../repros/08-nested-server-region/link-head.ts)
- [repro.test.ts](../repros/08-nested-server-region/repro.test.ts)
- [server.tsx](../repros/08-nested-server-region/server.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
