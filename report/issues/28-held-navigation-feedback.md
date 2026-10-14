---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: '[2.0 rc.15 + next] Held navigation never publishes delayed pending feedback'
findings: ['055']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
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

[Pinned complete source and failing Chrome test](https://github.com/celados/solid-conformance/tree/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/055-held-navigation-feedback).

### Steps to Reproduce the Bug or Issue

Mount Feedback in the persistent Router shell. Navigate to `/slow`, whose lazy children Promise remains unresolved, and wait 400 ms.
Run `TARGET=rc15 bun test ./findings/055-held-navigation-feedback/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The status indicator appears beside the old page at the old URL. Instead it stays absent: routing is true and the timer fires. Releasing the Promise commits the new page and clears routing normally.

### Platform

Solid rc.15 / next `e3716454129f`, Router next.39 / next `4a1685ec8f1a`; development and production; Bun 1.4.2, system Chrome.

### Additional context

Fixed Router next.30 passes on Solid rc.10/rc.13 and first fails on rc.14. Swapping compilers confirms the regression follows the runtime. Router's supported `solid` artifact also fails. Tested hand-rolled transitions without Router pass; the exact runtime trigger is not isolated. Related #3884 concerns supersession timing rather than this single-navigation display failure. No upstream writes were made.
