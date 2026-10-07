---
type: Issue
title: "Literal spread children allocate hydration IDs in a different order"
status: draft
tier: A
severity: low
findings: ['044']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: shape.tsx
---

# Literal spread children allocate hydration IDs in a different order

A literal spread containing one button should hydrate without mismatches. Final DOM and handler work, but development emits two tag-mismatch warnings.

```tsx
// SSR-render and hydrate this component. Dev logs two tag mismatches.
export function Shape(props: { clicked: () => void }) {
  return <div {...{ children: <button onClick={props.clicked}>click</button> }} />;
}
```

Requires SSR followed by hydration with the native Solid compiler. Render `Shape` on the server, hydrate it with a click callback, and inspect the development console. Clicking the button works, but hydration emits two tag-mismatch warnings.

**Expected:** The matching server and client tree hydrates without mismatch warnings.
**Actual:** Two tag-mismatch warnings appear; final nesting and the click handler are correct.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`. Development fails on HEAD and rc.13; production hydrates without these warnings.

Related: [#3313](https://github.com/solidjs/solid/issues/3313)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone folder](../repros/15-spread-children-hydration/) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](../repros/15-spread-children-hydration/build.ts)
- [client.tsx](../repros/15-spread-children-hydration/client.tsx)
- [link-head.ts](../repros/15-spread-children-hydration/link-head.ts)
- [repro.test.ts](../repros/15-spread-children-hydration/repro.test.ts)
- [server.tsx](../repros/15-spread-children-hydration/server.tsx)
- [shape.tsx](../repros/15-spread-children-hydration/shape.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
