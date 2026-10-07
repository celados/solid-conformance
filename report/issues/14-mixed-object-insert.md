---
type: Issue
title: "Unrenderable object beside text throws instead of being skipped"
status: draft
tier: A
severity: low
findings: ['034']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: App.tsx
snippet_kind: component
---

# Unrenderable object beside text throws instead of being skipped

An otherwise skipped object child throws during DOM insertion when placed next to text.

```tsx
export default function App() {
  const value = { bad: true };
  return <div>valid{value as any}</div>;
  // The object should be skipped, preserving "valid".
  // Instead mounting throws; <div>{value as any}</div> alone does not.
}
```

Paste into a Solid 2 playground and mount App. For comparison, remove the literal text valid.

**Expected:** The object is skipped and the div displays valid.
**Actual:** Mounting throws a DOM insertion TypeError; the object alone does not.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; development and production fail. rc.13 also fails the same case.

Related: [#3734](https://github.com/solidjs/solid/issues/3734)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/14-mixed-object-insert/) into a fresh Bun project. The displayed snippet is executed by snippet.test.ts. The original automated case is also retained.

- [App.tsx](../repros/14-mixed-object-insert/App.tsx)
- [build.ts](../repros/14-mixed-object-insert/build.ts)
- [client.tsx](../repros/14-mixed-object-insert/client.tsx)
- [link-head.ts](../repros/14-mixed-object-insert/link-head.ts)
- [repro.test.ts](../repros/14-mixed-object-insert/repro.test.ts)
- [snippet-client.tsx](../repros/14-mixed-object-insert/snippet-client.tsx)
- [snippet.test.ts](../repros/14-mixed-object-insert/snippet.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./snippet.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
