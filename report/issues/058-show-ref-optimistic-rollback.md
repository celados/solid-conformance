# Show: ref callback reads a stale branch accessor when an optimistic hide settles

**Versions:** solid-js, @solidjs/signals, @solidjs/web, @solidjs/compiler 2.0.0-rc.21; Bun and system Chrome, development build.

```tsx
import { Show, Switch, Match, action, createOptimistic } from 'solid-js'
import { render } from '@solidjs/web'
let release!: () => void
const gate = new Promise<void>(resolve => { release = resolve })
render(() => {
  const [visible, setVisible] = createOptimistic(1)
  const hide = action(function* () { setVisible(0); yield gate })
  Object.assign(window, { hide, release })
  return <Show when={visible()}>{value => <span ref={el => { el.title = String(value()) }}>visible</span>}</Show>
}, document.getElementById('root')!)
```

After mounting, call `hide()`, wait for the span to disappear, then call `release()`. Expected: the original branch returns with title `1` and no error. Actual: the ref callback throws a stale `<Show>` read during restoration, the span remains absent, and `REACTIVITY_HALTED` is logged.

Reproduce: `bun run report/repros/058-show-ref-optimistic-rollback/run.ts`. The ref does not escape its branch and is called by rendering. Replacing the ref read with a plain reactive attribute passes the comparison. No nested Show or spread is required.

Related: [#4137](https://github.com/solidjs/solid/issues/4137), fixed by [#4153](https://github.com/solidjs/solid/pull/4153), concerns a child memo rerun during an action; [#4341](https://github.com/solidjs/solid/issues/4341) concerns a Match memo reading `latest()` with async work. This case fails during restoration after the optimistic hide settles; shared cause has not been established.

Other related reports include [#3948](https://github.com/solidjs/solid/issues/3948) (a `latest()`-gated first mount) and [#2046](https://github.com/solidjs/solid/issues/2046) (an older transition case). Read-only searches did not find an exact ref/optimistic restoration match.
