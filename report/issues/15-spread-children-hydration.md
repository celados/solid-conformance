---
type: "Issue"
title: "[2.0 rc.13 + next] Literal spread children allocate hydration IDs in a different order"
status: "draft"
tier: "A"
severity: "low"
findings: ["044"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "shape.tsx"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

### Describe the bug

A literal spread containing one button should hydrate without mismatches. Final DOM and handler work, but development emits two tag-mismatch warnings.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```tsx
// SSR-render and hydrate this component. Dev logs two tag mismatches.
export function Shape(props: { clicked: () => void }) {
  return <div {...{ children: <button onClick={props.clicked}>click</button> }} />;
}
```

2. Requires SSR followed by hydration with the native Solid compiler. Render `Shape` on the server, hydrate it with a click callback, and inspect the development console. Clicking the button works, but hydration emits two tag-mismatch warnings.

### Expected behavior

**Expected:** The matching server and client tree hydrates without mismatch warnings.
**Actual:** Two tag-mismatch warnings appear; final nesting and the click handler are correct.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: Development fails on HEAD and rc.13; production hydrates without these warnings.

### Additional context

The same literal children should allocate matching server and client hydration structure, independent of whether they arrive via a spread.

Related: [#3313](https://github.com/solidjs/solid/issues/3313)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration/README.md).

Copy [the standalone folder](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration) into a fresh Bun project. The visible source above is executed by these tests; the additional files supply the required HTTP, compilation, and browser setup.

- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration/build.ts)
- [client.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration/client.tsx)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration/link-head.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration/repro.test.ts)
- [server.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration/server.tsx)
- [shape.tsx](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/15-spread-children-hydration/shape.tsx)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The link command selects a built Solid HEAD checkout; omit it for rc.13. Repeat with `BUILD_MODE=production` for the production comparison. Browser tests use system Google Chrome.

</details>
