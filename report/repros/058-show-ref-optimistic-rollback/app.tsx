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
