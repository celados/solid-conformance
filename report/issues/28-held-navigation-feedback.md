---
type: Issue
status: filed
filed: https://github.com/solidjs/solid/issues/4050
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: '[2.0 rc.15 + next] Held navigation never publishes delayed pending feedback'
findings: ['055']
repro_commit: 44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759
---

### Describe the bug

```tsx
function Feedback() {
  const pending = useIsRouting();
  const [elapsed, setElapsed] = createSignal(false);
  createEffect(pending, value => {
    if (!value) { setElapsed(false); return; }
    const timer = setTimeout(() => setElapsed(true), 300);
    return () => clearTimeout(timer);
  });
  return <Show when={pending() && latest(elapsed)}><b role="status">waiting</b></Show>;
}
```

### Your Example Website or App

[Standalone source, one-command setup and README](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/28-held-navigation-feedback).

### Steps to Reproduce the Bug or Issue

```sh
cd report/repros/28-held-navigation-feedback
bun install
bun run repro
```

The test mounts Feedback in the persistent Router shell, navigates to unresolved lazy route children, waits 400 ms, then releases the route promise. The README also supplies a one-command clean setup and a next-tag switch.

### Expected behavior

The status indicator appears beside the old page at the old URL. It remains absent although routing is true and the timer fires. Release commits the new page normally.

### Platform

Solid rc.15 and next e3716454129f; Router next.39 / HEAD 4a1685ec8f1a; Bun 1.4.2, system Chrome; development and production.

### Additional context

With Router next.30 fixed, Solid rc.13 passes and rc.14 first fails. Compiler rc.13/rc.14 swaps follow the runtime. Router next.39 and built Router HEAD also reproduce. Related [#3884](https://github.com/solidjs/solid/issues/3884) concerns supersession timing rather than this single-navigation feedback failure. Tested hand-rolled transitions without Router pass; the exact runtime trigger remains unisolated.
